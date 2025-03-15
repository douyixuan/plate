"use client";
import { createEditor, BaseEditor, BaseElement, BaseText, Descendant } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { useState, useMemo } from 'react';
import { MarkdownNodeType } from '../../../src/markdown-parser';

// Extend Slate types to support our custom markdown types
declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

// Custom element type that extends BaseElement
type CustomElement = BaseElement & {
  type: MarkdownNodeType;
  children: (CustomElement | CustomText)[];
};

// Custom text type that extends BaseText
type CustomText = BaseText & {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
};

export default function Home() {
  const [content, setContent] = useState<CustomElement[]>([
    {
      type: 'paragraph',
      children: [{ text: 'Start writing your markdown here...' }]
    }
  ]);

  const editor = useMemo(() => withReact(createEditor()), []);

  return (
    <Slate 
      editor={editor} 
      initialValue={content}
      onChange={(newContent: Descendant[]) => {
        // Filter and ensure only CustomElements are set
        const filteredContent = newContent.filter(
          (node): node is CustomElement => 
            typeof node === 'object' && 
            'type' in node && 
            'children' in node
        );
        setContent(filteredContent);
      }}
    >
      <Editable 
        placeholder="Write your markdown here..."
        style={{
          padding: '20px',
          minHeight: '300px',
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}
      />
    </Slate>
  );
}
