import assert from 'node:assert/strict';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import { syncBuiltinESMExports } from 'node:module';
import { urlToHttpOptions } from 'node:url';

const allowedHosts = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);
const allowedPorts = new Set((process.env.SERVICE_FIXTURE_PORTS ?? '').split(',').filter(Boolean).map(Number));
assert.ok(allowedPorts.size > 0 && [...allowedPorts].every(port => Number.isInteger(port) && port > 0 && port < 65536), 'Explicit fixture ports required');

/** Refuses transport outside the exact owned loopback listener ports. */
const validateDestination = (hostname, port) => {
  assert.ok(typeof hostname === 'string' && allowedHosts.has(hostname), 'Fixture prohibits non-loopback transport');
  assert.ok(allowedPorts.has(Number(port)), 'Fixture prohibits unowned loopback port');
};

/** Captures the effective HTTP destination after Node's URL/options merge. */
const validateHttp = (first, second, protocol) => {
  let merged;
  if (typeof first === 'string' || first instanceof URL) {
    const url = first instanceof URL ? first : new URL(first);
    merged = { ...urlToHttpOptions(url), ...(second && typeof second === 'object' ? second : {}) };
  } else {
    assert.ok(first && typeof first === 'object', 'Invalid fixture HTTP options');
    merged = { ...first };
  }
  assert.ok(!merged.socketPath, 'Fixture prohibits socket-path transport');
  const hostname = merged.hostname || merged.host || 'localhost';
  const port = merged.port || ((merged.protocol || protocol) === 'https:' ? 443 : 80);
  validateDestination(hostname, port);
  if (merged.host) assert.ok(allowedHosts.has(merged.host), 'Fixture prohibits non-loopback host override');
};

for (const [transport, protocol] of [[http, 'http:'], [https, 'https:']]) {
  for (const method of ['request', 'get']) {
    const original = transport[method];
    transport[method] = function guardedHttp(first, ...args) {
      validateHttp(first, args[0], protocol);
      return original.call(this, first, ...args);
    };
  }
}

/** Normalizes public and Node-internal socket overloads before connection. */
const validateSocket = (args) => {
  let first = args[0];
  if (Array.isArray(first)) first = first[0];
  if (first && typeof first === 'object') {
    assert.ok(!first.path, 'Fixture prohibits socket-path transport');
    validateDestination(first.host || first.hostname || 'localhost', first.port);
  } else {
    assert.ok(typeof first === 'number' || (typeof first === 'string' && /^\d+$/.test(first)), 'Fixture prohibits socket-path transport');
    validateDestination(typeof args[1] === 'string' ? args[1] : 'localhost', first);
  }
};

const connect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function guardedConnect(...args) {
  validateSocket(args);
  return connect.apply(this, args);
};

/** Checks Request/URL input and prevents redirects or custom dispatcher bypass. */
const guardedFetch = async (input, init) => {
  assert.ok(typeof input === 'string' || input instanceof URL || input instanceof Request, 'Invalid fixture fetch input');
  const url = new URL(input instanceof Request ? input.url : input);
  assert.ok(['http:', 'https:'].includes(url.protocol), 'Fixture prohibits non-HTTP transport');
  validateDestination(url.hostname, url.port || (url.protocol === 'https:' ? 443 : 80));
  assert.ok(!init?.dispatcher, 'Fixture prohibits custom fetch dispatcher');
  return originalFetch(input, { ...init, redirect: 'error' });
};
const originalFetch = globalThis.fetch;
globalThis.fetch = guardedFetch;
syncBuiltinESMExports();

export const snapshot = Object.freeze({ hosts: [...allowedHosts], ports: [...allowedPorts], redirect: 'error', mergedHttpOptions: true });
