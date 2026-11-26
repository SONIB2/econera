/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS preload for the Node test runner */
// Unit tests run server modules directly in Node; Next's "server-only" guard resolves to an empty module here.
const Module = require("node:module");
const path = require("node:path");
const empty = path.join(__dirname, "empty.cjs");
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  return request === "server-only" ? empty : resolve.call(this, request, ...rest);
};
