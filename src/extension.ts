// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import { PlateEditorProvider } from './plateEditorProvider';
import * as path from "path";

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
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

	// Add a new command to start the Plate Markdown Editor
	let startPlateEditorCommand = vscode.commands.registerCommand('plate.startEditor', () => {
		// Create a new untitled markdown file
		vscode.workspace.openTextDocument({ language: 'markdown' }).then(doc => {
			// Open the document with the Plate Markdown Editor
			vscode.commands.executeCommand('vscode.openWith', doc.uri, 'plate.markdownEditor');
		});
	});

	// Add a command to open an existing markdown file with Plate Editor
	let openWithPlateCommand = vscode.commands.registerCommand('plate.openWithPlate', async () => {
		// Prompt user to select a markdown file
		const uris = await vscode.window.showOpenDialog({
			canSelectMany: false,
			filters: {
				'Markdown Files': ['md']
			},
			title: 'Select a Markdown File to Open with Plate Editor'
		});

		if (uris && uris.length > 0) {
			// Open the selected file with Plate Markdown Editor
			await vscode.commands.executeCommand('vscode.openWith', uris[0], 'plate.markdownEditor');
		}
	});

	// Add commands to the extension's subscriptions
	context.subscriptions.push(startPlateEditorCommand);
	context.subscriptions.push(openWithPlateCommand);

	// Optional: Add a welcome message or information message
	vscode.window.showInformationMessage('Plate Markdown Editor is now active! Use the commands in the Command Palette.');
}

// This method is called when your extension is deactivated
export function deactivate() {}
