import * as vscode from 'vscode';
import { getNonce } from './utilities';

/**
 * Define a custom document type for our editor
 */
class PlateDocument implements vscode.CustomDocument {
  constructor(
    public readonly uri: vscode.Uri
  ) {}

  dispose(): void {
    // Clean up resources when document is closed
  }
}

/**
 * Provider for Plate markdown editor
 */
export class PlateEditorProvider implements vscode.CustomEditorProvider<PlateDocument> {
  
  private readonly _onDidChangeCustomDocument = new vscode.EventEmitter<vscode.CustomDocumentEditEvent<PlateDocument>>();
  public readonly onDidChangeCustomDocument = this._onDidChangeCustomDocument.event;
  
  // Track webviews
  private webviews = new Map<string, vscode.WebviewPanel>();
  
  constructor(
    private readonly context: vscode.ExtensionContext
  ) {}

  /**
   * Called when our custom editor is opened.
   */
  async openCustomDocument(
    uri: vscode.Uri,
    openContext: vscode.CustomDocumentOpenContext,
    _token: vscode.CancellationToken
  ): Promise<PlateDocument> {
    // Create and return a custom document for this uri
    return new PlateDocument(uri);
  }

  /**
   * Called when VS Code wants us to resolve a custom editor
   */
  async resolveCustomEditor(
    document: PlateDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    // Add the webview to our map
    this.webviews.set(document.uri.toString(), webviewPanel);
    
    // Configure webview
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, 'dist')
      ]
    };
    
    // Load webview content
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);
    
    // Set up communication between webview and extension
    this.setupWebviewMessageListener(webviewPanel.webview, document.uri);
    
    // Load the document content into the webview
    this.loadDocumentContent(webviewPanel.webview, document.uri);
  }

  /**
   * Save the document to the file system
   */
  async saveCustomDocument(
    document: PlateDocument, 
    cancellation: vscode.CancellationToken
  ): Promise<void> {
    // The actual saving is handled by our message listener
    await this.saveDocument(document.uri);
  }
  
  /**
   * Save the document to a different location
   */
  async saveCustomDocumentAs(
    document: PlateDocument,
    destination: vscode.Uri,
    cancellation: vscode.CancellationToken
  ): Promise<void> {
    // Read current content and write to new location
    const content = await vscode.workspace.fs.readFile(document.uri);
    await vscode.workspace.fs.writeFile(destination, content);
  }
  
  /**
   * Revert the document to its last saved state
   */
  async revertCustomDocument(
    document: PlateDocument,
    cancellation: vscode.CancellationToken
  ): Promise<void> {
    // Reload content from disk
    const webview = this.webviews.get(document.uri.toString())?.webview;
    if (webview) {
      this.loadDocumentContent(webview, document.uri);
    }
  }
  
  /**
   * Backup the document
   */
  async backupCustomDocument(
    document: PlateDocument,
    context: vscode.CustomDocumentBackupContext,
    cancellation: vscode.CancellationToken
  ): Promise<vscode.CustomDocumentBackup> {
    // For simplicity, just use the file on disk as the backup
    return {
      id: context.destination.toString(),
      delete: async () => {
        try {
          await vscode.workspace.fs.delete(context.destination);
        } catch {
          // Ignore
        }
      }
    };
  }

  /**
   * Get the HTML for the webview
   */
  private getHtmlForWebview(webview: vscode.Webview): string {
    const nonce = getNonce();
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
        <title>Plate Markdown Editor</title>
      </head>
      <body>
        <div id="root"></div>
        <script nonce="${nonce}">
          // Basic webview setup
          const vscode = acquireVsCodeApi();
        </script>
        <script nonce="${nonce}" src="${webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview.js'))}"></script>
      </body>
      </html>
    `;
  }

  /**
   * Set up messaging between webview and extension
   */
  private setupWebviewMessageListener(webview: vscode.Webview, documentUri: vscode.Uri) {
    webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'save':
            // Handle save request
            try {
              await vscode.workspace.fs.writeFile(
                documentUri,
                Buffer.from(message.content)
              );
            } catch (e) {
              vscode.window.showErrorMessage(`Failed to save file: ${e}`);
            }
            break;
        }
      },
      undefined,
      this.context.subscriptions
    );
  }

  /**
   * Load document content into the webview
   */
  private async loadDocumentContent(webview: vscode.Webview, documentUri: vscode.Uri) {
    try {
      const content = await vscode.workspace.fs.readFile(documentUri);
      webview.postMessage({
        command: 'load',
        content: Buffer.from(content).toString()
      });
    } catch (e) {
      vscode.window.showErrorMessage(`Failed to load file: ${e}`);
    }
  }
  
  /**
   * Save document content
   */
  private async saveDocument(uri: vscode.Uri): Promise<void> {
    const webview = this.webviews.get(uri.toString())?.webview;
    if (webview) {
      // Request content from webview and save it
      webview.postMessage({ command: 'requestSave' });
      // The actual saving happens when the webview responds with a save message
    }
  }
}