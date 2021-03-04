// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as cp from 'child_process';
import * as vscode from 'vscode';
import * as os from 'os';

var ochan: vscode.OutputChannel;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "vscode-formatter-godot" is now active!');

    /*context.subscriptions.push(vscode.commands.registerCommand('vscode-formatter-godot.format-foo', () => {
        const { activeTextEditor } = vscode.window;

        if (activeTextEditor) {
            vscode.window.showInformationMessage(activeTextEditor.document.languageId);
        }
    })); */

    ochan = vscode.window.createOutputChannel("Godot Formatter");

    var diag = vscode.languages.createDiagnosticCollection("gdlint");

    var doLint = (doc: vscode.TextDocument) => {
        let content = doc.fileName;
        let uri = doc.uri;

        if (uri.scheme === "file" && doc.languageId === 'gdscript') {
            let cmd = `gdlint ` + content + ` 2>&1`;

            var cpo = cp.exec(cmd, (err, stdout, stderr) => {

                let diagArr: vscode.Diagnostic[] = [];
                stdout.split('\n').forEach((i) => {
                    var iS = i.split(":", 4);
                    if (iS.length == 4) {
                        var iNum = Number.parseInt(iS[1]);
                        var iStr = iS[3];
                        ochan.append("err: " + iNum + " - " + iStr + '\n');
                        var va = new vscode.Diagnostic(new vscode.Range(new vscode.Position(iNum-1, 0), new vscode.Position(iNum-1, 9999)), iS[3], vscode.DiagnosticSeverity.Error);
                        va.code = "test";
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
