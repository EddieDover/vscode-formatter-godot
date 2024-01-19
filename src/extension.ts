import * as cp from 'child_process';
import * as os from 'os';
import * as vscode from 'vscode';

var ochan: vscode.OutputChannel;
const matchregex: RegExp = /(\w+\.gd):(\d+):\s?Error\:\s?(.+)?/g;

export function activate(context: vscode.ExtensionContext) {
    console.log('\'GDScript Formatter & Linter\' is now active!');

    ochan = vscode.window.createOutputChannel("Godot Formatter");

    var diag = vscode.languages.createDiagnosticCollection("gdlint");

    var doLint = (doc: vscode.TextDocument) => {
        let content = doc.fileName;
        let uri = doc.uri;
        let dir = vscode.workspace.getWorkspaceFolder(uri)?.uri.fsPath || "";
        const severityLevel = vscode.workspace.getConfiguration("godotFormatterAndLinter").get("lintSeverityLevel", "Error");

        if (uri.scheme === "file" && doc.languageId === 'gdscript') {
            let cmd = `gdlint ` + content + ` 2>&1`;

            var cpo = cp.exec(cmd, {cwd: dir}, (err, stdout, stderr) => {

                let diagArr: vscode.Diagnostic[] = [];
                const lines = stdout.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
                lines.map((line:string) => {
                    matchregex.lastIndex = 0;
                    const match = matchregex.exec(line);
                    if (match) {
                        let filenname = match[1];
                        let line = parseInt(match[2]) - 1;
                        let message = match[3];
                        ochan.append("Error: " + filenname + ":" + line + ": " + message + "");
                        const va = new vscode.Diagnostic(new vscode.Range(line, 0, line, 0), message, vscode.DiagnosticSeverity[severityLevel]);
                        va.code = "gdlint";
                        diagArr.push(va);
                    }

                });
                ochan.append("setting an array with " + diagArr.length + "elements as diag for URI: " + uri + '\n');
                diag.set(uri, []);
                diag.set(uri, diagArr);

            });
            cpo.stdin?.write(content);
            cpo.stdin?.end(os.EOL);
        }
    };
    //setInterval(doLint, 5000);

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                doLint(editor.document);
            }
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(e => doLint(e.document))
    );

    context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider('gdscript', {
        async provideDocumentFormattingEdits(document: vscode.TextDocument): Promise<vscode.TextEdit[]> {
            let content = document.getText();
            return new Promise((res, rej) => {
                let cmd = `gdformat -`;

                var cpo = cp.exec(cmd, (err, stdout, stderr) => {
                    //ochan.append("stdout: " + stdout);
                    ochan.append("stderr: " + stderr);
                    ochan.append("err: " + err);
                    if (err) {
                        rej([]);
                    }
                    res([vscode.TextEdit.replace(new vscode.Range(new vscode.Position(0, 0), new vscode.Position(document.lineCount, 9999999)), stdout)]);
                });
                cpo.stdin?.write(content);
                cpo.stdin?.end(os.EOL);

            });
        }
    }));
}

// this method is called when your extension is deactivated
export function deactivate() { }
