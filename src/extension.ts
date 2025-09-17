import * as vscode from 'vscode';
import { VisualEditorProvider } from './visualEditor';

export function activate(context: vscode.ExtensionContext) {
  const provider = new VisualEditorProvider(context);
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider('vscode-html-editor.customEditor', provider),
    vscode.commands.registerCommand('vscode-html-editor.open', (uri: vscode.Uri) => {
      const activeEditor = vscode.window.activeTextEditor;
      if (uri) {
        vscode.commands.executeCommand('vscode.openWith', uri, 'vscode-html-editor.customEditor');
      } else if (activeEditor?.document.languageId === 'html') {
        vscode.commands.executeCommand(
          'vscode.openWith', activeEditor.document.uri, 'vscode-html-editor.customEditor'
        );
      }
    }),
    vscode.commands.registerCommand('vscode-html-editor.openBeside', () => {
      const activeEditor = vscode.window.activeTextEditor;
      if (activeEditor?.document.languageId === 'html') {
        vscode.commands.executeCommand(
          'vscode.openWith',
          activeEditor.document.uri,
          'vscode-html-editor.customEditor',
          {
            viewColumn: vscode.ViewColumn.Beside,
            preserveFocus: true
          }
        );
      }
    }),
    vscode.commands.registerCommand('vscode-html-editor.showSource', () => {
      const activeCode = provider.activeCode;
      if (activeCode) {
        vscode.window.visibleTextEditors.some(editor => {
          if (editor.document === activeCode) {
            vscode.window.showTextDocument(editor.document, editor.viewColumn);
            return true;
          }
        }) || vscode.commands.executeCommand('vscode.open', activeCode.uri);
      }
    })
  );
}

export function deactivate() { }
