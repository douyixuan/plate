// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { PlateEditorProvider } from './plateEditorProvider';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "plate" is now active!');

	// Register the custom editor provider
	context.subscriptions.push(
		vscode.window.registerCustomEditorProvider(
			'plate.markdownEditor',
			new PlateEditorProvider(context),
			{
				webviewOptions: { retainContextWhenHidden: true },
				supportsMultipleEditorsPerDocument: false
			}
		)
	);

	// Register the command to open markdown files with Plate editor
	context.subscriptions.push(
		vscode.commands.registerCommand('plate.openWithPlate', async () => {
			// Get the active text editor
			const editor = vscode.window.activeTextEditor;
			if (!editor || editor.document.languageId !== 'markdown') {
				vscode.window.showErrorMessage('No markdown file is open');
				return;
			}

			// Open the document in the Plate custom editor
			await vscode.commands.executeCommand(
				'vscode.openWith',
				editor.document.uri,
				'plate.markdownEditor'
			);
		})
	);

	// Hello world command (you can remove this if not needed)
	context.subscriptions.push(
		vscode.commands.registerCommand('plate.helloWorld', () => {
			vscode.window.showInformationMessage('Hello from Plate Markdown Editor!');
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
