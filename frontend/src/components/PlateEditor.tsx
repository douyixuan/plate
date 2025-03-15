import React, { useState, useEffect, useMemo } from 'react';
import { 
  createEditor, 
  BaseEditor, 
  BaseElement, 
  BaseText, 
  Descendant
} from 'slate';
import { Slate, Editable, withReact, RenderElementProps, RenderLeafProps } from 'slate-react';
import { 
  MarkdownParser, 
  MarkdownNode, 
  MarkdownNodeType,
  validateMessage 
} from '../../../src/markdown-parser';

// Extend Slate types to support our custom markdown types
declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

// Custom element type that extends BaseElement
interface CustomElement extends BaseElement {
  type: MarkdownNodeType;
  children: (CustomElement | CustomText)[];
}

// Custom text type that extends BaseText
interface CustomText extends BaseText {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
}

// Type guard to check if an element is a CustomElement
function isCustomElement(element: Descendant): element is CustomElement {
  return (element as CustomElement).type !== undefined;
}

// Type guard to check if a node is a CustomText
function isCustomText(node: Descendant): node is CustomText {
  return (node as CustomText).text !== undefined;
}

// VSCode webview type definition
declare function acquireVsCodeApi(): {
  postMessage(message: Record<string, unknown>): void;
  setState(state: Record<string, unknown>): void;
  getState(): Record<string, unknown>;
};

// Convert MarkdownNode to Slate-compatible format
function markdownToSlate(nodes: MarkdownNode[]): CustomElement[] {
  return nodes.map(node => ({
    type: node.type,
    children: node.children.map(child => 
      'text' in child 
        ? { 
            text: child.text, 
            ...(child.bold && { bold: true }), 
            ...(child.italic && { italic: true }) 
          }
        : child
    )
  }));
}

// Convert Slate format back to MarkdownNode
function slateToMarkdown(nodes: Descendant[]): MarkdownNode[] {
  return nodes
    .filter(isCustomElement)
    .map(node => ({
      type: node.type,
      children: node.children
        .filter(isCustomText)
        .map(child => ({ 
          text: child.text, 
          ...(child.bold && { bold: true }), 
          ...(child.italic && { italic: true }) 
        }))
    }));
}

export const PlateEditor: React.FC = () => {
  const [content, setContent] = useState<CustomElement[]>([
    { 
      type: 'paragraph', 
      children: [{ text: '' }] 
    }
  ]);

  // Create a Slate editor object that won't change
  const editor = useMemo(() => withReact(createEditor()), []);

  useEffect(() => {
    const vscode = acquireVsCodeApi();
    
    // Enhanced message handler with validation
    const messageHandler = (event: MessageEvent) => {
      // Validate incoming message
      if (!validateMessage(event.data)) {
        console.error('Invalid message received', event.data);
        return;
      }

      switch (event.data.type) {
        case 'load':
          try {
            // Parse markdown content using shared parser
            const parsedContent = MarkdownParser.parse(event.data.content);
            const slateContent = markdownToSlate(parsedContent);
            setContent(slateContent);
            
            // Store state with version for tracking
            vscode.setState({ 
              content: slateContent,
              version: event.data.version || Date.now().toString()
            });
          } catch (error) {
            console.error('Failed to load content:', error);
            vscode.postMessage({ 
              type: 'error', 
              content: 'Failed to parse markdown content' 
            });
          }
          break;
        
        case 'save':
          // Convert content back to markdown using shared parser
          const markdownNodes = slateToMarkdown(content);
          const markdownContent = MarkdownParser.serialize(markdownNodes);
          vscode.postMessage({
            type: 'save',
            content: markdownContent,
            version: Date.now().toString()
          });
          break;
      }
    };

    window.addEventListener('message', messageHandler);
    
    // Request initial content
    vscode.postMessage({ type: 'requestLoad' });

    return () => {
      window.removeEventListener('message', messageHandler);
    };
  }, []);

  const handleContentChange = (newContent: Descendant[]) => {
    // Ensure only custom elements are set
    const filteredContent = newContent.filter(isCustomElement);
    setContent(filteredContent);
    
    const vscode = acquireVsCodeApi();
    vscode.postMessage({
      type: 'update',
      content: JSON.stringify(filteredContent),
      version: Date.now().toString()
    });
  };

  return (
    <Slate 
      editor={editor} 
      initialValue={content}
      onChange={handleContentChange}
    >
      <Editable
        placeholder="Write your markdown here..."
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        style={{
          padding: '20px',
          minHeight: '300px',
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}
      />
    </Slate>
  );
};

// Render different element types
const renderElement = ({ element, attributes, children }: RenderElementProps) => {
  // Ensure a default paragraph if type checking fails
  if (!isCustomElement(element)) {
    return <p {...attributes}>{children}</p>;
  }

  switch (element.type) {
    case 'heading1':
      return <h1 {...attributes}>{children}</h1>;
    case 'heading2':
      return <h2 {...attributes}>{children}</h2>;
    case 'heading3':
      return <h3 {...attributes}>{children}</h3>;
    case 'blockquote':
      return <blockquote {...attributes}>{children}</blockquote>;
    case 'code':
      return <pre {...attributes}><code>{children}</code></pre>;
    default:
      return <p {...attributes}>{children}</p>;
  }
};

// Render text with formatting
const renderLeaf = ({ leaf, attributes, children }: RenderLeafProps) => {
  // Ensure a default span if type checking fails
  if (!isCustomText(leaf)) {
    return <span {...attributes}>{children}</span>;
  }

  let renderedChildren = children;
  if (leaf.bold) {
    renderedChildren = <strong>{renderedChildren}</strong>;
  }
  if (leaf.italic) {
    renderedChildren = <em>{renderedChildren}</em>;
  }
  if (leaf.code) {
    renderedChildren = <code>{renderedChildren}</code>;
  }
  return <span {...attributes}>{renderedChildren}</span>;
};

export default PlateEditor;