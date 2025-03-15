import * as vscode from 'vscode';
import { PlateEditorProvider } from './plateEditorProvider';
import * as path from "path";

// Debugging utility
function log(message: string) {
  console.log(`[Plate Markdown Editor] ${message}`);
}

export function activate(context: vscode.ExtensionContext) {
  try {
    // Enable debug logging
    log('Activating Plate Markdown Editor');

    // Register the custom editor provider
    const plateEditorProvider = new PlateEditorProvider(context);
    context.subscriptions.push(
      vscode.window.registerCustomEditorProvider(
        'plate.markdownEditor',
        plateEditorProvider,
        {
          webviewOptions: { retainContextWhenHidden: true },
          supportsMultipleEditorsPerDocument: false
        }
      )
    );

    // Command to open a new markdown file with Plate Editor
    const newMarkdownCommand = vscode.commands.registerCommand('plate.newMarkdownFile', async () => {
      try {
        // Create a new untitled markdown document
        const document = await vscode.workspace.openTextDocument({
          language: 'markdown',
          content: '# New Markdown File\n\nStart writing here...'
        });

        // Open the document with Plate Editor
        await vscode.window.showTextDocument(document, { preview: false });
        await vscode.commands.executeCommand('vscode.openWith', document.uri, 'plate.markdownEditor');
        
        log('Created new markdown file with Plate Editor');
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to create markdown file: ${error}`);
        log(`Error creating markdown file: ${error}`);
      }
    });

    // Command to open existing markdown file with Plate Editor
    const openWithPlateCommand = vscode.commands.registerCommand('plate.openWithPlate', async (fileUri?: vscode.Uri) => {
      try {
        // If no URI provided, prompt user to select a file
        if (!fileUri) {
          const selection = await vscode.window.showOpenDialog({
            canSelectMany: false,
            filters: {
              'Markdown Files': ['md']
            },
            title: 'Select Markdown File to Open with Plate Editor'
          });

          if (selection && selection.length > 0) {
            fileUri = selection[0];
          } else {
            return; // User cancelled
          }
        }

        // Verify it's a markdown file
        if (path.extname(fileUri.fsPath).toLowerCase() !== '.md') {
          vscode.window.showWarningMessage('Please select a markdown (.md) file');
          return;
        }

        // Open with Plate Editor
        await vscode.commands.executeCommand('vscode.openWith', fileUri, 'plate.markdownEditor');
        
        log(`Opened file with Plate Editor: ${fileUri.fsPath}`);
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to open file with Plate Editor: ${error}`);
        log(`Error opening file: ${error}`);
      }
    });

    // Automatically suggest Plate Editor for markdown files
    context.subscriptions.push(
      vscode.workspace.onDidOpenTextDocument((document) => {
        if (document.languageId === 'markdown') {
          // Optional: Show information message about Plate Editor
          vscode.window.showInformationMessage(
            'This is a markdown file. Would you like to open it with Plate Editor?', 
            'Open with Plate Editor'
          ).then((selection) => {
            if (selection === 'Open with Plate Editor') {
              vscode.commands.executeCommand('vscode.openWith', document.uri, 'plate.markdownEditor');
            }
          });
        }
      })
    );

    // Add commands to extension subscriptions
    context.subscriptions.push(
      newMarkdownCommand,
      openWithPlateCommand
    );

    // Show activation message
    vscode.window.showInformationMessage('Plate Markdown Editor is now active!');

    log('Plate Markdown Editor activated successfully');
  } catch (error) {
    // Catch any unexpected errors during activation
    vscode.window.showErrorMessage(`Failed to activate Plate Markdown Editor: ${error}`);
    log(`Activation error: ${error}`);
  }
}

// This method is called when your extension is deactivated
export function deactivate() {
  log('Plate Markdown Editor deactivated');
}
