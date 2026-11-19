import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";
import Module from "node:module";
import ts from "typescript";

// Compile the actual TypeScript modules in memory; no generated test files.
export const loadTs = (relativePath, mocks = {}) => {
  const filename = fileURLToPath(new URL("../../" + relativePath, import.meta.url));
  const result = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    fileName: filename,
  });
  const mod = new Module(filename);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  mod.require = id => Object.hasOwn(mocks, id) ? mocks[id] : Module.prototype.require.call(mod, id);
  mod._compile(result.outputText, filename);
  return mod.exports;
};
