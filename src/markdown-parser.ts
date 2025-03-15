// Shared Markdown Parsing Library

export type MarkdownNodeType = 
  | 'paragraph' 
  | 'heading1' 
  | 'heading2' 
  | 'heading3' 
  | 'blockquote' 
  | 'code' 
  | 'list' 
  | 'listItem'
  | 'emphasis'
  | 'strong';

export interface MarkdownNode {
  type: MarkdownNodeType;
  children: (MarkdownNode | TextNode)[];
  depth?: number; // For headings
  ordered?: boolean; // For lists
}

export interface TextNode {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
}

export class MarkdownParser {
  /**
   * Parse markdown string into a structured node tree
   * @param markdown Markdown content to parse
   * @returns Array of markdown nodes
   */
  static parse(markdown: string): MarkdownNode[] {
    const lines = markdown.split('\n');
    const nodes: MarkdownNode[] = [];

    for (const line of lines) {
      // Heading parsing
      if (line.startsWith('# ')) {
        nodes.push({
          type: 'heading1',
          children: [{ text: line.slice(2).trim() }]
        });
        continue;
      }
      if (line.startsWith('## ')) {
        nodes.push({
          type: 'heading2',
          children: [{ text: line.slice(3).trim() }]
        });
        continue;
      }
      if (line.startsWith('### ')) {
        nodes.push({
          type: 'heading3',
          children: [{ text: line.slice(4).trim() }]
        });
        continue;
      }

      // Blockquote parsing
      if (line.startsWith('> ')) {
        nodes.push({
          type: 'blockquote',
          children: [{ text: line.slice(2).trim() }]
        });
        continue;
      }

      // Code block parsing (basic implementation)
      if (line.startsWith('```')) {
        nodes.push({
          type: 'code',
          children: [{ text: line.slice(3).trim(), code: true }]
        });
        continue;
      }

      // Default to paragraph
      if (line.trim()) {
        nodes.push({
          type: 'paragraph',
          children: [{ text: line.trim() }]
        });
      }
    }

    return nodes;
  }

  /**
   * Convert node tree back to markdown string
   * @param nodes Markdown nodes to serialize
   * @returns Markdown string
   */
  static serialize(nodes: MarkdownNode[]): string {
    return nodes.map(node => {
      const text = node.children[0] as TextNode;
      
      switch (node.type) {
        case 'heading1':
          return `# ${text.text}`;
        case 'heading2':
          return `## ${text.text}`;
        case 'heading3':
          return `### ${text.text}`;
        case 'blockquote':
          return `> ${text.text}`;
        case 'code':
          return `\`\`\`${text.text}`;
        case 'paragraph':
          return text.text;
        default:
          return text.text;
      }
    }).join('\n');
  }
}

// Message protocol for communication
export type EditorMessageType = 'load' | 'save' | 'update' | 'error';

export interface EditorMessage {
  version: string;
  type: EditorMessageType;
  content: string;
  metadata?: Record<string, unknown>;
}

export function validateMessage(message: unknown): message is EditorMessage {
  if (typeof message !== 'object' || message === null) return false;
  
  const msg = message as EditorMessage;
  return (
    typeof msg.version === 'string' &&
    ['load', 'save', 'update', 'error'].includes(msg.type) &&
    typeof msg.content === 'string'
  );
}