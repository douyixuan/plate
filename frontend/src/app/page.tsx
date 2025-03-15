"use client";
import { PlateElement, PlateLeaf, PlateProvider, createPlateEditor } from "@udecode/plate-ui";
import { useState } from "react";

const components = {
  element: PlateElement,
  leaf: PlateLeaf,
};

export default function Home() {
  const [editor] = useState(() => createPlateEditor());

  return (
    <PlateProvider editor={editor} components={components}>
      <div style={{ padding: "30px" }}>
        <div className="editor">Plate Editor</div>
      </div>
    </PlateProvider>
  );
}
