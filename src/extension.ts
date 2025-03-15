import * as vscode from 'vscode';
import { PlateEditorProvider } from './plateEditorProvider';
import * as path from "path";

// Logging configuration
class LogManager {
  private static _instance: LogManager;
  private _isLoggingEnabled: boolean;

  private constructor() {
    // Read initial logging state from configuration
    this._isLoggingEnabled = vscode.workspace
      .getConfiguration('plate')
      .get('enableLogging', false);
  }

  public static getInstance(): LogManager {
    if (!LogManager._instance) {
      LogManager._instance = new LogManager();
    }
    return LogManager._instance;
  }

  public log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
    if (!this._isLoggingEnabled) return;

    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [Plate Markdown Editor] [${level.toUpperCase()}] ${message}`;

    switch (level) {
      case 'info':
        console.log(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
        console.error(formattedMessage);
        break;
    }
  }

  public toggleLogging() {
    this._isLoggingEnabled = !this._isLoggingEnabled;
    
    // Update configuration
    vscode.workspace
      .getConfiguration('plate')
      .update('enableLogging', this._isLoggingEnabled, vscode.ConfigurationTarget.Global);

    this.log(`Logging ${this._isLoggingEnabled ? 'enabled' : 'disabled'}`, 'info');
  }

  public isLoggingEnabled(): boolean {
    return this._isLoggingEnabled;
  }
}

export function activate(context: vscode.ExtensionContext) {
  const logger = LogManager.getInstance();

  try {
    // Log activation start
    logger.log('Starting Plate Markdown Editor activation process', 'info');

    // Register the custom editor provider
    logger.log('Registering custom editor provider', 'info');
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

    // Command to toggle logging
    logger.log('Registering toggle logging command', 'info');
    const toggleLoggingCommand = vscode.commands.registerCommand('plate.toggleLogging', () => {
      logger.toggleLogging();
      vscode.window.showInformationMessage(`Plate Markdown Editor logging ${logger.isLoggingEnabled() ? 'enabled' : 'disabled'}`);
    });

    // Command to open a new markdown file with Plate Editor
    logger.log('Registering new markdown file command', 'info');
    const newMarkdownCommand = vscode.commands.registerCommand('plate.newMarkdownFile', async () => {
      try {
        logger.log('Creating new markdown file', 'info');
        
        // Create a new untitled markdown document
        const document = await vscode.workspace.openTextDocument({
          language: 'markdown',
          content: '# New Markdown File\n\nStart writing here...'
        });

        // Open the document with Plate Editor
        await vscode.window.showTextDocument(document, { preview: false });
        await vscode.commands.executeCommand('vscode.openWith', document.uri, 'plate.markdownEditor');
        
        logger.log('Successfully created new markdown file', 'info');
      } catch (error) {
        logger.log(`Failed to create markdown file: ${error}`, 'error');
        vscode.window.showErrorMessage(`Failed to create markdown file: ${error}`);
      }
    });

    // Command to open existing markdown file with Plate Editor
    logger.log('Registering open with Plate command', 'info');
    const openWithPlateCommand = vscode.commands.registerCommand('plate.openWithPlate', async (fileUri?: vscode.Uri) => {
      try {
        logger.log('Attempting to open markdown file with Plate Editor', 'info');
        
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
            logger.log('File selection cancelled', 'info');
            return; // User cancelled
          }
        }

        // Verify it's a markdown file
        if (path.extname(fileUri.fsPath).toLowerCase() !== '.md') {
          logger.log('Selected file is not a markdown file', 'warn');
          vscode.window.showWarningMessage('Please select a markdown (.md) file');
          return;
        }

        // Open with Plate Editor
        await vscode.commands.executeCommand('vscode.openWith', fileUri, 'plate.markdownEditor');
        
        logger.log(`Opened file with Plate Editor: ${fileUri.fsPath}`, 'info');
      } catch (error) {
        logger.log(`Failed to open file with Plate Editor: ${error}`, 'error');
        vscode.window.showErrorMessage(`Failed to open file with Plate Editor: ${error}`);
      }
    });

    // Automatically suggest Plate Editor for markdown files
    logger.log('Setting up markdown file detection', 'info');
    context.subscriptions.push(
      vscode.workspace.onDidOpenTextDocument((document) => {
        if (document.languageId === 'markdown') {
          logger.log('Markdown file detected', 'info');
          // Optional: Show information message about Plate Editor
          vscode.window.showInformationMessage(
            'This is a markdown file. Would you like to open it with Plate Editor?', 
            'Open with Plate Editor'
          ).then((selection) => {
            if (selection === 'Open with Plate Editor') {
              logger.log('User chose to open with Plate Editor', 'info');
              vscode.commands.executeCommand('vscode.openWith', document.uri, 'plate.markdownEditor');
            }
          });
        }
      })
    );

    // Add commands to extension subscriptions
    context.subscriptions.push(
      newMarkdownCommand,
      openWithPlateCommand,
      toggleLoggingCommand
    );

    // Show activation message
    logger.log('Plate Markdown Editor activated successfully', 'info');
    vscode.window.showInformationMessage('Plate Markdown Editor is now active!');

  } catch (error) {
    // Catch any unexpected errors during activation
    logger.log(`Activation error: ${error}`, 'error');
    vscode.window.showErrorMessage(`Failed to activate Plate Markdown Editor: ${error}`);
  }
}

// This method is called when your extension is deactivated
export function deactivate() {
  LogManager.getInstance().log('Plate Markdown Editor deactivated', 'info');
}
