import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";
import { lintDocument } from "../../extension";

const getFixtureFilePath = (root: string, filename: string) =>
  path.resolve(root, filename);

const getFixture = async (category: string, type: string, filename: string) => {
  return await vscode.workspace.openTextDocument(
    getFixtureFilePath(`../../fixtures/${category}/${type}/`, filename)
  );
};

suite("Godot Linting Tests", async () => {
  let ochan: vscode.OutputChannel;
  let diag: vscode.DiagnosticCollection;

  suiteSetup(async () => {
    ochan = vscode.window.createOutputChannel("gdlint");
    diag = vscode.languages.createDiagnosticCollection("gdlint");
  });

  test("Sample test", () => {
    assert.strictEqual([1, 2, 3].indexOf(5), -1);
    assert.strictEqual([1, 2, 3].indexOf(0), -1);
  });

  suite("Testing Linter", async () => {
    test("should PASS with No Errors", async () => {
      let diagArr: vscode.Diagnostic[] = [];

      const doc = await getFixture("passing", "linting", "noerrors.gd");

      diagArr = lintDocument(doc, diag, ochan);

      assert.strictEqual(diagArr.length, 0);
    });

    test("should FAIL with \"Unexpected token Token('_INDENT', '\\t\\t')\"", async () => {
      let diagArr: vscode.Diagnostic[] = [];

      const doc = await getFixture(
        "failing",
        "linting",
        "unnecessarytoken_bad_indent.gd"
      );

      diagArr = lintDocument(doc, diag, ochan);

      assert.strictEqual(diagArr.length, 1);
      assert.strictEqual(diagArr[0].code, "gdlint");
      assert.strictEqual(diagArr[0].range.isSingleLine, true);
      assert.strictEqual(diagArr[0].range.start.line, 11); // Subtract one from the comparison because line numbers are 1-based
      assert.strictEqual(diagArr[0].range.start.character, 0);
      assert.strictEqual(
        diagArr[0].message,
        "Unexpected token Token('_INDENT', '\\t\\t')"
      );
    });

    test("should FAIL with 'pass statement not necessary (unnecessary-pass)'", async () => {
      let diagArr: vscode.Diagnostic[] = [];

      const doc = await getFixture("failing", "linting", "unnecessary-pass.gd");

      diagArr = lintDocument(doc, diag, ochan);

      assert.strictEqual(diagArr.length, 1);
      assert.strictEqual(diagArr[0].code, "gdlint");
      assert.strictEqual(diagArr[0].range.isSingleLine, true);
      assert.strictEqual(diagArr[0].range.start.line, 11); // Subtract one from the comparison because line numbers are 1-based
      assert.strictEqual(
        diagArr[0].message,
        '"pass" statement not necessary (unnecessary-pass)'
      );
    });

    test("should FAIL with \"unused function argument 'delta' (unused-argument)\"", async () => {
      let diagArr: vscode.Diagnostic[] = [];

      const doc = await getFixture("failing", "linting", "unused-argument.gd");

      diagArr = lintDocument(doc, diag, ochan);

      assert.strictEqual(diagArr.length, 1);
      assert.strictEqual(diagArr[0].code, "gdlint");
      assert.strictEqual(diagArr[0].range.isSingleLine, true);
      assert.strictEqual(diagArr[0].range.start.line, 9); // Subtract one from the comparison because line numbers are 1-based
      assert.strictEqual(
        diagArr[0].message,
        "unused function argument 'delta' (unused-argument)"
      );
    });
  });

  suite("Testing Formatter", async () => {
    test("should simulate a Format Document command", async () => {
      const doc = await getFixture("failing", "linting", "unnecessary-pass.gd");
      const d = doc.getText().replace(/\r/g, "");

      await vscode.window.showTextDocument(doc);
      await vscode.commands.executeCommand("editor.action.formatDocument");

      const text = doc.getText().replace(/\r/g, "");
      assert.strictEqual(text.trim(), d);
    });

    test("should format a document with unnecessary spaces around operators", async () => {
      const doc = await getFixture("failing", "formatting", "fmt-test1.gd");
      const doc2 = await getFixture("passing", "formatting", "fmt-test1.gd");
      const d = doc2.getText().replace(/\r/g, "");

      await vscode.window.showTextDocument(doc);
      await vscode.commands.executeCommand("editor.action.formatDocument");

      const text = doc.getText().replace(/\r/g, "");
      assert.strictEqual(text, d);
    });
  });
});
