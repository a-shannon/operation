import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const hashPattern = /^0x[0-9a-fA-F]{64}$/;
const addressPattern = /^0x[0-9a-fA-F]{40}$/;
const dataPattern = /^0x(?:[0-9a-fA-F]{2})*$/;
const methods = new Set([
  'eth_chainId',
  'eth_getBlockByNumber',
  'eth_getTransactionByHash',
  'eth_getTransactionReceipt',
  'eth_getCode',
  'eth_estimateGas',
]);

/** Reads a canonical unsigned RPC quantity without rounding integer values. */
const quantity = (value, field) => {
  assert.equal(typeof value, 'string', `Invalid ${field}`);
  assert.match(value, /^0x(?:0|[1-9a-f][0-9a-f]*)$/, `Invalid ${field}`);
  const number = BigInt(value);
  assert.ok(number < 1n << 256n, `Invalid ${field}`);
  return number;
};

/** Requires a nonzero EVM address supplied by the deployment owner. */
const address = (value, field) => {
  assert.equal(typeof value, 'string', `Invalid ${field}`);
  assert.match(value, addressPattern, `Invalid ${field}`);
  assert.notEqual(BigInt(value), 0n, `Invalid ${field}`);
};

/** Validates all supplied policy inputs before making an endpoint request. */
const validatePolicy = (policy) => {
  assert.ok(policy && policy.enabled === true, 'Endpoint inspection is disabled');
  assert.ok([43113, 43114].includes(policy.chainId), 'Invalid explicit chainId');
  assert.match(policy.sourceId ?? '', /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/, 'Invalid sourceId');
  assert.equal(typeof policy.url, 'string', 'Invalid endpoint URL');
  const url = new URL(policy.url);
  assert.ok(['http:', 'https:'].includes(url.protocol) && !url.username && !url.password && !url.hash, 'Invalid endpoint URL');
  assert.ok(Number.isSafeInteger(policy.requestTimeoutMs) && policy.requestTimeoutMs > 0 && policy.requestTimeoutMs <= 2147483647, 'Invalid requestTimeoutMs');
  assert.ok(Number.isSafeInteger(policy.initialHeight) && policy.initialHeight >= -1 && policy.initialHeight < Number.MAX_SAFE_INTEGER, 'Invalid initialHeight');
  assert.match(policy.knownTransactionHash ?? '', hashPattern, 'Invalid knownTransactionHash');
  address(policy.lockAddress, 'lockAddress');
  assert.match(policy.expectedLockCodeSha256 ?? '', /^[0-9a-f]{64}$/, 'Invalid expectedLockCodeSha256');
  if (policy.payment !== null) {
    const p = policy.payment;
    assert.ok(p && typeof p === 'object', 'Invalid payment');
    assert.deepEqual(Object.keys(p).sort(), ['data', 'from', 'gasLimitCap', 'to', 'value'], 'Invalid payment fields');
    address(p.from, 'payment.from'); address(p.to, 'payment.to');
    quantity(p.value, 'payment.value');
    assert.match(p.data ?? '', dataPattern, 'Invalid payment.data');
    assert.ok(p.data.length <= 131074, 'Payment data exceeds inspection limit');
    assert.ok(quantity(p.gasLimitCap, 'payment.gasLimitCap') > 0n, 'Invalid payment.gasLimitCap');
  }
};

/** Checks a returned block's height and hash before binding another read to it. */
const block = (value, expectedHeight) => {
  assert.ok(value && typeof value === 'object', 'Missing block');
  const height = quantity(value.number, 'block number');
  assert.ok(height <= BigInt(Number.MAX_SAFE_INTEGER), 'Block height exceeds supported range');
  if (expectedHeight !== undefined) assert.equal(height, expectedHeight, 'Wrong block height');
  assert.match(value.hash ?? '', hashPattern, 'Invalid block hash');
  assert.notEqual(BigInt(value.hash), 0n, 'Invalid block hash');
  return { height, hash: value.hash.toLowerCase() };
};

/** Checks sampled extractor fields without claiming signed-transaction admission. */
const transactionFields = (tx, expectedIndex) => {
  assert.ok(tx && typeof tx === 'object' && !Array.isArray(tx), 'Full transaction object unavailable');
  assert.match(tx.input ?? '', dataPattern, 'Transaction input unavailable');
  assert.match(tx.from ?? '', addressPattern, 'Transaction sender unavailable');
  assert.ok(Object.hasOwn(tx, 'to') && (tx.to === null || (typeof tx.to === 'string' && addressPattern.test(tx.to))), 'Transaction destination unavailable');
  quantity(tx.value, 'transaction value');
  quantity(tx.nonce, 'transaction nonce');
  const index = quantity(tx.transactionIndex, 'transaction index');
  if (expectedIndex !== undefined) assert.equal(index, BigInt(expectedIndex), 'Wrong historical transaction index');
  return index;
};

/** Runs one bounded read-only endpoint sample using explicitly supplied Rosen inputs. */
export const inspectAvalancheEndpoint = async (policy, { authToken } = {}) => {
  policy = structuredClone(policy);
  validatePolicy(policy);
  assert.ok(authToken === undefined || (typeof authToken === 'string' && authToken.length > 0 && !/[\r\n]/.test(authToken)), 'Invalid endpoint authentication');
  let id = 0;
  const requests = [];
  /** Sends an allowlisted read and checks its bounded JSON-RPC envelope. */
  const rpc = async (method, params) => {
    assert.ok(methods.has(method), 'Unsupported inspection method');
    const requestId = ++id;
    requests.push({ method, params });
    let response;
    try {
      response = await fetch(policy.url, {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(policy.requestTimeoutMs),
        headers: { 'content-type': 'application/json', ...(authToken ? { authorization: `Bearer ${authToken}` } : {}) },
        body: JSON.stringify({ jsonrpc: '2.0', id: requestId, method, params }),
      });
      assert.ok(response.ok && response.body, 'Endpoint HTTP refusal');
      const chunks = [], reader = response.body.getReader();
      let bytes = 0;
      try {
        for (;;) {
          const next = await reader.read();
          if (next.done) break;
          bytes += next.value.byteLength;
          assert.ok(bytes <= 20 * 1024 * 1024, 'Endpoint response exceeds inspection limit');
          chunks.push(next.value);
        }
      } finally { await reader.cancel(); }
      const envelope = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      assert.equal(envelope.jsonrpc, '2.0', 'Invalid RPC version');
      assert.equal(envelope.id, requestId, 'Wrong RPC response identity');
      assert.ok(!Object.hasOwn(envelope, 'error') && Object.hasOwn(envelope, 'result'), 'Endpoint RPC refusal');
      return envelope.result;
    } catch { throw new Error(`Endpoint read failed: ${method}`); }
  };
  const chain = await rpc('eth_chainId', []);
  assert.equal(quantity(chain, 'chainId'), BigInt(policy.chainId), 'Wrong endpoint chain');
  const settled = block(await rpc('eth_getBlockByNumber', ['finalized', false]));
  const startHeight = BigInt(policy.initialHeight + 1);
  assert.ok(startHeight <= settled.height, 'Scan start exceeds finalized frontier');
  const history = await rpc('eth_getBlockByNumber', [`0x${startHeight.toString(16)}`, true]);
  const historical = block(history, startHeight);
  assert.ok(Array.isArray(history.transactions), 'Historical transaction bodies unavailable');
  const historicalTransactions = new Map();
  for (const [index, tx] of history.transactions.entries()) {
    assert.ok(tx && typeof tx === 'object', 'Historical full transaction unavailable');
    assert.match(tx.hash ?? '', hashPattern, 'Invalid historical transaction hash');
    assert.equal(quantity(tx.blockNumber, 'historical transaction height'), startHeight, 'Wrong historical transaction height');
    assert.equal(tx.blockHash?.toLowerCase(), historical.hash, 'Wrong historical transaction block');
    transactionFields(tx, index);
    assert.ok(!historicalTransactions.has(tx.hash.toLowerCase()), 'Duplicate historical transaction');
    historicalTransactions.set(tx.hash.toLowerCase(), tx);
  }
  const transaction = await rpc('eth_getTransactionByHash', [policy.knownTransactionHash]);
  assert.ok(transaction, 'Known transaction unavailable');
  assert.equal(transaction.hash?.toLowerCase(), policy.knownTransactionHash.toLowerCase(), 'Wrong transaction hash');
  const txHeight = quantity(transaction.blockNumber, 'transaction height');
  assert.ok(txHeight <= settled.height, 'Known transaction is not finalized');
  const txIndex = transactionFields(transaction);
  const historicalTransaction = historicalTransactions.get(policy.knownTransactionHash.toLowerCase());
  if (historicalTransaction) {
    assert.equal(txHeight, startHeight, 'Known transaction contradicts historical height');
    assert.equal(transaction.blockHash?.toLowerCase(), historical.hash, 'Known transaction contradicts historical block');
    assert.equal(transaction.input.toLowerCase(), historicalTransaction.input.toLowerCase(), 'Known transaction contradicts historical input');
    for (const field of ['from', 'to']) assert.equal(transaction[field]?.toLowerCase(), historicalTransaction[field]?.toLowerCase(), `Known transaction contradicts historical ${field}`);
    for (const field of ['value', 'nonce', 'transactionIndex']) assert.equal(quantity(transaction[field], field), quantity(historicalTransaction[field], field), `Known transaction contradicts historical ${field}`);
  } else {
    assert.notEqual(txHeight, startHeight, 'Known transaction missing from historical block');
  }
  const canonical = block(await rpc('eth_getBlockByNumber', [`0x${txHeight.toString(16)}`, false]), txHeight);
  assert.equal(transaction.blockHash?.toLowerCase(), canonical.hash, 'Wrong transaction block');
  const receipt = await rpc('eth_getTransactionReceipt', [policy.knownTransactionHash]);
  assert.ok(receipt, 'Known receipt unavailable');
  assert.equal(receipt.transactionHash?.toLowerCase(), policy.knownTransactionHash.toLowerCase(), 'Wrong receipt transaction');
  assert.equal(quantity(receipt.blockNumber, 'receipt height'), txHeight, 'Wrong receipt height');
  assert.equal(receipt.blockHash?.toLowerCase(), canonical.hash, 'Wrong receipt block');
  assert.equal(quantity(receipt.transactionIndex, 'receipt transaction index'), txIndex, 'Wrong receipt transaction index');
  assert.equal(quantity(receipt.status, 'receipt status'), 1n, 'Known transaction did not succeed');
  const tag = `0x${settled.height.toString(16)}`;
  const code = await rpc('eth_getCode', [policy.lockAddress, tag]);
  assert.match(code ?? '', dataPattern, 'Invalid lock code');
  const codeSha256 = createHash('sha256').update(Buffer.from(code.slice(2), 'hex')).digest('hex');
  assert.equal(codeSha256, policy.expectedLockCodeSha256, 'Lock code differs from owner reference');
  let gasEstimate = null;
  if (policy.payment !== null) {
    const { gasLimitCap, ...call } = policy.payment;
    const estimate = quantity(await rpc('eth_estimateGas', [call, tag]), 'gas estimate');
    assert.ok(estimate > 0n && estimate <= quantity(gasLimitCap, 'payment.gasLimitCap'), 'Gas estimate exceeds owner cap');
    gasEstimate = estimate.toString();
  }
  assert.equal(block(await rpc('eth_getBlockByNumber', [tag, false]), settled.height).hash, settled.hash, 'Finalized block changed during sample');
  assert.equal(quantity(await rpc('eth_chainId', []), 'chainId'), BigInt(policy.chainId), 'Endpoint chain changed during sample');
  return {
    scope: 'bounded read-only endpoint sample', sourceId: policy.sourceId, chainId: policy.chainId,
    finalizedHeight: settled.height.toString(), finalizedHash: settled.hash,
    firstScanHeight: startHeight.toString(), firstScanHash: historical.hash,
    knownTransactionHash: policy.knownTransactionHash, receiptBlockHash: canonical.hash,
    lockCodeSha256: codeSha256, gasEstimate, sampledAt: new Date().toISOString(), requests,
  };
};

/** Reads a private policy file and writes the observed sample to standard output. */
const main = async () => {
  assert.deepEqual(process.argv.slice(2, 3), ['--policy'], 'Expected --policy <private-json-file>');
  assert.equal(process.argv.length, 4, 'Expected --policy <private-json-file>');
  const bytes = await readFile(process.argv[3]);
  assert.ok(bytes.length <= 262144, 'Inspection policy exceeds size limit');
  const report = await inspectAvalancheEndpoint(JSON.parse(bytes.toString('utf8')), { authToken: process.env.AVALANCHE_RPC_AUTH_TOKEN });
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
};

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch(() => { process.stderr.write('Avalanche endpoint inspection refused; check the policy and endpoint sample.\n'); process.exitCode = 1; });
}
