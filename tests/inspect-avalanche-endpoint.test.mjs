import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { inspectAvalancheEndpoint } from '../scripts/inspect-avalanche-endpoint.mjs';

const blockHash = '0x' + 'aa'.repeat(32);
const historicalHash = '0x' + 'bb'.repeat(32);
const txHash = '0x' + 'cc'.repeat(32);
const historicalTxHash = '0x' + 'dd'.repeat(32);
const code = '0x6000';
const codeHash = createHash('sha256').update(Buffer.from('6000', 'hex')).digest('hex');
const safeMethods = new Set(['eth_chainId', 'eth_getBlockByNumber', 'eth_getTransactionByHash', 'eth_getTransactionReceipt', 'eth_getCode', 'eth_estimateGas']);
const transactionBody = { input: '0x', from: '0x' + '33'.repeat(20), to: '0x' + '11'.repeat(20), value: '0x1', nonce: '0x0', transactionIndex: '0x0' };

/** Creates explicit synthetic inputs for one local endpoint sample. */
const policy = () => ({
  enabled: true, chainId: 43113, sourceId: 'fixture-a',
  url: 'http://127.0.0.1:1', requestTimeoutMs: 1000, initialHeight: 0,
  knownTransactionHash: txHash, lockAddress: '0x' + '11'.repeat(20),
  expectedLockCodeSha256: codeHash, payment: null,
});

/** Supplies canonical settled RPC fields without any signing or write method. */
const response = (request) => {
  const { method, params } = request;
  if (method === 'eth_chainId') return '0xa869';
  if (method === 'eth_getBlockByNumber') {
    const historical = params[0] === '0x1';
    return { number: historical ? '0x1' : '0x2', hash: historical ? historicalHash : blockHash,
      transactions: params[1] ? [{ ...transactionBody, hash: historicalTxHash, blockNumber: '0x1', blockHash: historicalHash }] : [] };
  }
  if (method === 'eth_getTransactionByHash') return { ...transactionBody, hash: txHash, blockHash, blockNumber: '0x2' };
  if (method === 'eth_getTransactionReceipt') return { transactionHash: txHash, blockHash, blockNumber: '0x2', transactionIndex: '0x0', status: '0x1' };
  if (method === 'eth_getCode') return code;
  if (method === 'eth_estimateGas') return '0x5208';
  throw new Error('Unexpected fixture method');
};

/** Runs the real fetch transport against a single owned loopback HTTP server. */
const withEndpoint = async (run, change = (_request, envelope) => envelope) => {
  const requests = [];
  const server = createServer(async (incoming, outgoing) => {
    const chunks = []; for await (const chunk of incoming) chunks.push(chunk);
    const request = JSON.parse(Buffer.concat(chunks).toString());
    assert.ok(safeMethods.has(request.method), 'No write request may reach transport');
    requests.push(request);
    const envelope = change(request, { jsonrpc: '2.0', id: request.id, result: response(request) });
    outgoing.writeHead(200, { 'content-type': 'application/json' }); outgoing.end(JSON.stringify(envelope));
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const input = { ...policy(), url: `http://127.0.0.1:${server.address().port}` };
  try { await run(input, requests); }
  finally { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
};

test('actual loopback reads bind chain, start block, receipt and owner code reference', async () => {
  await withEndpoint(async (input, requests) => {
    const result = await inspectAvalancheEndpoint(input);
    assert.equal(result.finalizedHeight, '2'); assert.equal(result.firstScanHeight, '1');
    assert.equal(result.finalizedHash, blockHash); assert.equal(result.receiptBlockHash, blockHash);
    assert.equal(result.lockCodeSha256, codeHash); assert.equal(result.gasEstimate, null);
    assert.equal(requests.length, 9);
    assert.deepEqual(requests[6].params, [input.lockAddress, '0x2']);
    assert.equal(requests[1].params[0], 'finalized');
    assert.ok(requests.every((r) => !r.params.includes('latest') && !r.params.includes('pending')));
  });
});

test('payment estimate uses the exact supplied call and numeric finalized state', async () => {
  await withEndpoint(async (input, requests) => {
    input.payment = { from: input.lockAddress, to: '0x' + '22'.repeat(20), value: '0x1', data: '0x', gasLimitCap: '0x5208' };
    const result = await inspectAvalancheEndpoint(input);
    assert.equal(result.gasEstimate, '21000');
    const { gasLimitCap: _cap, ...call } = input.payment;
    assert.deepEqual(requests.find((r) => r.method === 'eth_estimateGas').params, [call, '0x2']);
  });
});

test('caller mutation during a read cannot redirect the captured policy or authentication', async () => {
  let mutable;
  await withEndpoint(async (input, requests) => {
    mutable = input;
    const result = await inspectAvalancheEndpoint(input, { authToken: 'synthetic-fixture-token' });
    assert.equal(result.sourceId, 'fixture-a'); assert.equal(result.chainId, 43113);
    assert.equal(requests.length, 9);
  }, (request, envelope) => {
    if (request.id === 1) { mutable.url = 'http://127.0.0.1:1'; mutable.chainId = 43114; mutable.sourceId = 'changed'; }
    return envelope;
  });
});

const policyFaults = [
  ['disabled', { enabled: false }], ['unsupported chain', { chainId: 1 }],
  ['missing source', { sourceId: '' }], ['credential URL', { url: 'https://user:password@example.invalid/' }],
  ['fragment URL', { url: 'https://example.invalid/#value' }], ['wrong protocol', { url: 'file:///invalid' }],
  ['missing timeout', { requestTimeoutMs: 0 }], ['fractional height', { initialHeight: 0.5 }],
  ['missing transaction', { knownTransactionHash: null }], ['zero lock', { lockAddress: '0x' + '00'.repeat(20) }],
  ['missing code reference', { expectedLockCodeSha256: null }], ['missing payment choice', { payment: undefined }],
];
for (const [name, change] of policyFaults) test(`invalid ${name} refuses before transport`, async () => {
  await withEndpoint(async (input, requests) => {
    await assert.rejects(inspectAvalancheEndpoint({ ...input, ...change }));
    assert.equal(requests.length, 0);
  });
});

const responseFaults = [
  ['chain', 'eth_chainId', (e) => ({ ...e, result: '0xa86a' })],
  ['envelope id', 'eth_chainId', (e) => ({ ...e, id: 999 })],
  ['RPC error', 'eth_chainId', (e) => ({ ...e, error: { code: -1 } })],
  ['missing finalized', 'eth_getBlockByNumber', (e, r) => r.params[0] === 'finalized' ? { ...e, result: null } : e],
  ['wrong historical height', 'eth_getBlockByNumber', (e, r) => r.params[0] === '0x1' ? { ...e, result: { ...e.result, number: '0x2' } } : e],
  ['missing full body', 'eth_getBlockByNumber', (e, r) => r.params[0] === '0x1' ? { ...e, result: { ...e.result, transactions: [txHash] } } : e],
  ['transaction block', 'eth_getTransactionByHash', (e) => ({ ...e, result: { ...e.result, blockHash: historicalHash } })],
  ['receipt identity', 'eth_getTransactionReceipt', (e) => ({ ...e, result: { ...e.result, transactionHash: blockHash } })],
  ['receipt height', 'eth_getTransactionReceipt', (e) => ({ ...e, result: { ...e.result, blockNumber: '0x1' } })],
  ['receipt block', 'eth_getTransactionReceipt', (e) => ({ ...e, result: { ...e.result, blockHash: historicalHash } })],
  ['receipt status', 'eth_getTransactionReceipt', (e) => ({ ...e, result: { ...e.result, status: '0x0' } })],
  ['lock code', 'eth_getCode', (e) => ({ ...e, result: '0x6001' })],
];
for (const [name, method, fault] of responseFaults) test(`isolated ${name} contradiction refuses the sample`, async () => {
  await withEndpoint(async (input) => { await assert.rejects(inspectAvalancheEndpoint(input)); },
    (request, envelope) => request.method === method ? fault(envelope, request) : envelope);
});

test('a later numeric frontier contradiction is detected after the initial reads pass', async () => {
  await withEndpoint(async (input) => { await assert.rejects(inspectAvalancheEndpoint(input), /Finalized block changed/); },
    (r, e) => r.id === 8 ? { ...e, result: { ...e.result, hash: historicalHash } } : e);
});

test('a later chain contradiction is detected after the initial reads pass', async () => {
  await withEndpoint(async (input) => { await assert.rejects(inspectAvalancheEndpoint(input), /chain changed/); },
    (r, e) => r.id === 9 ? { ...e, result: '0xa86a' } : e);
});

test('owner gas cap is enforced without emitting a write or signing request', async () => {
  await withEndpoint(async (input, requests) => {
    input.payment = { from: input.lockAddress, to: '0x' + '22'.repeat(20), value: '0x1', data: '0x', gasLimitCap: '0x5207' };
    await assert.rejects(inspectAvalancheEndpoint(input), /Gas estimate exceeds owner cap/);
    assert.equal(requests.at(-1).method, 'eth_estimateGas');
  });
});

test('an own RPC error key refuses even when its value is null', async () => {
  await withEndpoint(async (input, requests) => {
    await assert.rejects(inspectAvalancheEndpoint(input), /Endpoint read failed: eth_chainId/);
    assert.equal(requests.length, 1);
  }, (request, envelope) => request.id === 1 ? { ...envelope, error: null } : envelope);
});

test('a historical transaction without its input refuses at the full-body check', async () => {
  await withEndpoint(async (input, requests) => {
    await assert.rejects(inspectAvalancheEndpoint(input), /Transaction input unavailable/);
    assert.equal(requests.length, 3);
  }, (request, envelope) => {
    if (request.id !== 3) return envelope;
    const { input: _input, ...tx } = envelope.result.transactions[0];
    return { ...envelope, result: { ...envelope.result, transactions: [tx] } };
  });
});

test('one hash cannot belong to both the sampled historical block and another lookup block', async () => {
  await withEndpoint(async (input, requests) => {
    await assert.rejects(inspectAvalancheEndpoint(input), /Known transaction contradicts historical height/);
    assert.equal(requests.length, 4);
  }, (request, envelope) => request.id === 3 ? { ...envelope, result: { ...envelope.result, transactions: [{ ...envelope.result.transactions[0], hash: txHash }] } } : envelope);
});

test('a known transaction in the sampled block binds both reads to its payload', async () => {
  await withEndpoint(async (input, requests) => {
    const result = await inspectAvalancheEndpoint(input);
    assert.equal(result.receiptBlockHash, historicalHash);
    assert.equal(requests.length, 9);
  }, (request, envelope) => {
    if (request.id === 3) return { ...envelope, result: { ...envelope.result, transactions: [{ ...envelope.result.transactions[0], hash: txHash }] } };
    if (request.id === 4 || request.id === 6) return { ...envelope, result: { ...envelope.result, blockNumber: '0x1', blockHash: historicalHash } };
    return envelope;
  });
});

test('a known transaction missing from its claimed sampled block refuses', async () => {
  await withEndpoint(async (input) => {
    await assert.rejects(inspectAvalancheEndpoint(input), /Known transaction missing from historical block/);
  }, (request, envelope) => request.id === 4 ? { ...envelope, result: { ...envelope.result, blockNumber: '0x1', blockHash: historicalHash } } : envelope);
});

test('a known transaction with contradictory sampled payload refuses', async () => {
  await withEndpoint(async (input) => {
    await assert.rejects(inspectAvalancheEndpoint(input), /Known transaction contradicts historical input/);
  }, (request, envelope) => {
    if (request.id === 3) return { ...envelope, result: { ...envelope.result, transactions: [{ ...envelope.result.transactions[0], hash: txHash }] } };
    if (request.id === 4) return { ...envelope, result: { ...envelope.result, blockNumber: '0x1', blockHash: historicalHash, input: '0x01' } };
    return envelope;
  });
});

const historicalBodyFaults = [
  ['odd input', { input: '0x1' }, /Transaction input unavailable/],
  ['missing sender', { from: undefined }, /Transaction sender unavailable/],
  ['missing destination', { to: undefined }, /Transaction destination unavailable/],
  ['noncanonical value', { value: '0x01' }, /Invalid transaction value/],
  ['missing nonce', { nonce: undefined }, /Invalid transaction nonce/],
  ['wrong ordered index', { transactionIndex: '0x1' }, /Wrong historical transaction index/],
];
for (const [name, change, error] of historicalBodyFaults) test(`isolated historical ${name} refuses its consumed-field check`, async () => {
  await withEndpoint(async (input, requests) => {
    await assert.rejects(inspectAvalancheEndpoint(input), error);
    assert.equal(requests.length, 3);
  }, (request, envelope) => request.id === 3 ? { ...envelope, result: { ...envelope.result, transactions: [{ ...envelope.result.transactions[0], ...change }] } } : envelope);
});

test('generic EVM contract creation and zero destination remain valid sampled bodies', async () => {
  await withEndpoint(async (input) => { await inspectAvalancheEndpoint(input); }, (request, envelope) => {
    if (request.id === 3) return { ...envelope, result: { ...envelope.result, transactions: [{ ...envelope.result.transactions[0], to: null }] } };
    if (request.id === 4) return { ...envelope, result: { ...envelope.result, to: '0x' + '00'.repeat(20) } };
    return envelope;
  });
});

test('duplicate historical hashes refuse before a known transaction lookup', async () => {
  await withEndpoint(async (input) => { await assert.rejects(inspectAvalancheEndpoint(input), /Duplicate historical transaction/); }, (request, envelope) => {
    if (request.id !== 3) return envelope;
    const tx = envelope.result.transactions[0];
    return { ...envelope, result: { ...envelope.result, transactions: [tx, { ...tx, transactionIndex: '0x1' }] } };
  });
});

test('a receipt at another transaction index refuses its binding', async () => {
  await withEndpoint(async (input) => { await assert.rejects(inspectAvalancheEndpoint(input), /Wrong receipt transaction index/); }, (request, envelope) => request.id === 6 ? { ...envelope, result: { ...envelope.result, transactionIndex: '0x1' } } : envelope);
});

test('uppercase quantity prefix refuses before qualifying the endpoint chain', async () => {
  await withEndpoint(async (input, requests) => {
    await assert.rejects(inspectAvalancheEndpoint(input), /Invalid chainId/);
    assert.equal(requests.length, 1);
  }, (request, envelope) => request.id === 1 ? { ...envelope, result: '0Xa869' } : envelope);
});

test('uppercase quantity digits refuse the canonical consumer grammar', async () => {
  await withEndpoint(async (input, requests) => {
    await assert.rejects(inspectAvalancheEndpoint(input), /Invalid chainId/);
    assert.equal(requests.length, 1);
  }, (request, envelope) => request.id === 1 ? { ...envelope, result: '0xA869' } : envelope);
});

test('disabled published template refuses in the real CLI and contains no deployment assignment', async () => {
  const template = new URL('../config/avalanche-endpoint-inspection.template.json', import.meta.url);
  const value = JSON.parse(await readFile(template, 'utf8'));
  assert.equal(value.enabled, false); assert.equal(value.chainId, null); assert.equal(value.lockAddress, null);
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('../scripts/inspect-avalanche-endpoint.mjs', import.meta.url)), '--policy', fileURLToPath(template)], { encoding: 'utf8', windowsHide: true });
  assert.equal(result.status, 1); assert.equal(result.stdout, '');
  assert.equal(result.stderr, 'Avalanche endpoint inspection refused; check the policy and endpoint sample.\n');
});
