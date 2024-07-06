import * as cp from "child_process";
import * as os from "os";
import * as vscode from "vscode";

export const matchRegexError: RegExp = /(\w+\.gd):(\d+):\s?Error:\s?(.+)?/g;
export const matchRegexToken: RegExp = /(.+) at line (\d+), column (\d+)\./gm;
export const matchRegexUnexpectedToken: RegExp =
  /Token(.+):(\d+):(\d+): Unexpected token(.+)/g;
export const matchRegexTokenFile: RegExp = /['|"]?(.+\.gd):['|"]?/g;

const severityLevel = vscode.workspace
  .getConfiguration("godotFormatterAndLinter")
  .get("lintSeverityLevel", "Error");

let timeout: NodeJS.Timeout | undefined = undefined;

export const scanLineForGeneralError = (
  line: string,
  diagArr: any[],
  code: string,
  ochan: vscode.OutputChannel
) => {
  let match = matchRegexError.exec(line);
  if (match) {
    let filename = match[1];
    let lineno = parseInt(match[2]) - 1;
    let message = match[3];
    ochan.append("Error: " + filename + ":" + lineno + ": " + message + "\n");
    const va = new vscode.Diagnostic(
      new vscode.Range(lineno, 0, lineno, line.length - 1),
      message,
      vscode.DiagnosticSeverity[severityLevel]
    );
    va.code = code;
    diagArr.push(va);
  }
};

export const scanLineForTokenError = (
  line: string,
  diagArr: any[],
  code: string,
  ochan: vscode.OutputChannel
) => {
  let tokenFile = "";
  let match = matchRegexTokenFile.exec(line);
  if (match) {
    tokenFile = match[1];
  }

  match = matchRegexToken.exec(line);
  if (match) {
    let message = match[1];
    let lineno = parseInt(match[2]);
    let colno = parseInt(match[3]);
    ochan.append(
      "Token: " + tokenFile + ":" + lineno + ":" + colno + ": " + message + "\n"
    );
    const va = new vscode.Diagnostic(
      new vscode.Range(lineno, 0, lineno, line.length - 1),
      message,
      vscode.DiagnosticSeverity[severityLevel]
    );
    va.code = code;
    diagArr.push(va);
  }
};

export const scanLineForUnexpectedTokenError = (
  line: string,
  diagArr: any[],
  code: string,
  ochan: vscode.OutputChannel
) => {
  let tokenFile = "";
  let match = matchRegexTokenFile.exec(line);
  if (match) {
    tokenFile = match[1];
  }

  match = matchRegexUnexpectedToken.exec(line);
  if (match) {
    let message = match[4];
    let lineno = parseInt(match[2]);
    let colno = parseInt(match[3]);
    ochan.append(
      "Token: " + tokenFile + ":" + lineno + ":" + colno + ": " + message + "\n"
    );
    const va = new vscode.Diagnostic(
      new vscode.Range(lineno, 0, lineno, line.length - 1),
      message,
      vscode.DiagnosticSeverity[severityLevel]
    );
    va.code = code;
    diagArr.push(va);
  }
};

export async function formatDocument(
  document: vscode.TextDocument
): Promise<vscode.TextEdit[]> {
  let content = document.getText();
  const indentType = vscode.workspace
    .getConfiguration("godotFormatterAndLinter")
    .get("indentType");
  const indentSpacesSize = vscode.workspace
    .getConfiguration("godotFormatterAndLinter")
    .get("indentSpacesSize");
  const indentParam =
    indentType === "Tabs" ? "" : `--use-spaces=${indentSpacesSize}`;
  const lineLength = vscode.workspace
    .getConfiguration("godotFormatterAndLinter")
    .get("lineLength");
  return new Promise((res, rej) => {
    let cmd = `gdformat --line-length=${lineLength} ${indentParam} -`;

    const cpo = cp.exec(cmd, (err, stdout, stderr) => {
      if (err) {
        rej(err);
      }
      res([
        vscode.TextEdit.replace(
          new vscode.Range(
            new vscode.Position(0, 0),
            new vscode.Position(document.lineCount, 9999999)
          ),
          stdout
        ),
      ]);
    });
    cpo.stdin?.write(content);
    cpo.stdin?.end(os.EOL);
  });
}

export const lintDocument = (
  doc: vscode.TextDocument,
  diag: vscode.DiagnosticCollection,
  ochan: vscode.OutputChannel
) => {
  let content = doc.fileName;
  let uri = doc.uri;
  let diagArr: vscode.Diagnostic[] = [];

  if (uri.scheme === "file" && doc.languageId === "gdscript") {
    let cmd = `gdlint "${content}" 2>&1`;

    const result = cp.spawnSync(cmd, { shell: true, stdio: "pipe" });

    const { stdout } = result;
    let lines: string[] = stdout?.toString().split("\n") ?? [];
    lines = lines.map((line) => line.trim()).filter((line) => line.length > 0);
    lines.map((line: string) => {
      matchRegexTokenFile.lastIndex = 0;
      matchRegexError.lastIndex = 0;

      scanLineForGeneralError(line, diagArr, "gdlint", ochan);
      scanLineForTokenError(line, diagArr, "gdlint", ochan);
      scanLineForUnexpectedTokenError(line, diagArr, "gdlint", ochan);
    });

    diag.clear();
    diag.set(uri, [...diagArr]);
  }
  return [...diagArr];
};

export function activate(context: vscode.ExtensionContext) {
  const extension = vscode.extensions.getExtension(
    "eddiedover.gdscript-formatter-linter"
  );
  const version = extension?.packageJSON.version;
  console.log(`'GDScript Formatter & Linter' ${version} is now active!`);

  const ochan = vscode.window.createOutputChannel("Godot Formatter");
  const diag = vscode.languages.createDiagnosticCollection("gdlint");

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        if (timeout) {
          clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
          lintDocument(editor.document, diag, ochan);
        }, 300); // 300ms debounce
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((editor) => {
      if (!editor?.document?.isDirty) {
        if (timeout) {
          clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
          lintDocument(editor.document, diag, ochan);
        }, 300); // 300ms debounce
      }
    })
  );

  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider("gdscript", {
      provideDocumentFormattingEdits: formatDocument,
    })
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
