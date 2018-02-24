// @flow

const glob = require("glob");
const diff = require("jest-diff");
const { NO_DIFF_MESSAGE } = require("jest-diff/build/constants");
const { writeFileSync, readFileSync } = require("fs");
const path = require("path");

const { parseBinary } = require("../lib");

function toArrayBuffer(buf) {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

function createCheck(suite, ast) {
  const expectedFile = path.join(path.dirname(suite), "expected.json");
  const code = JSON.stringify(ast, null, 2);

  let expected;
  try {
    expected = readFileSync(expectedFile, "utf8");
    expected = JSON.stringify(JSON.parse(expected), null, 2);
  } catch (e) {
    expected = code;

    writeFileSync(expectedFile, code);

    console.log("Write expected file", expectedFile);
  }

  const out = diff(code.trim(), expected.trim());

  if (out !== null && out !== NO_DIFF_MESSAGE) {
    throw new Error("\n" + out);
  }

  // When one line the error is not caught
  if (code.trim() !== expected.trim()) {
    throw new Error("Assertion error");
  }
}

describe("compiler", () => {
  describe("Binary format parsing", () => {
    const testSuites = glob.sync(
      "packages/wasm-parser/test/fixtures/**/actual.wasm"
    );

    testSuites.forEach(suite => {
      it(suite, () => {
        const bin = toArrayBuffer(readFileSync(suite, null));
        const ast = parseBinary(bin);
        createCheck(suite, ast);
      });
    });
  });
});
