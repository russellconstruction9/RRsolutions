
import React, { useRef, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

// A simple button component for the toolbar
const ToolbarButton: React.FC<{ onExec: () => void; children: React.ReactNode, 'aria-label': string }> = ({ onExec, children, 'aria-label': ariaLabel }) => {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault(); // Prevent editor from losing focus
        onExec();
      }}
      className="p-2 rounded hover:bg-gray-200 transition-colors"
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync editor content when the value prop changes (e.g., when switching tabs)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    onChange(e.currentTarget.innerHTML);
  };
  
  const execCmd = (command: string, value: string | null = null) => {
    document.execCommand(command, false, value);
    // After executing a command, we manually trigger the onChange
    // because execCommand doesn't fire an 'input' event.
    if(editorRef.current) {
        onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="w-full h-full flex flex-col border border-gray-300 rounded-lg shadow-inner focus-within:ring-2 focus-within:ring-brand-blue focus-within:border-brand-blue">
      {/* Toolbar */}
      <div className="flex items-center p-2 border-b bg-gray-50 rounded-t-lg">
        <ToolbarButton onExec={() => execCmd('bold')} aria-label="Bold">
           <strong className="font-bold text-lg">B</strong>
        </ToolbarButton>
        <ToolbarButton onExec={() => execCmd('italic')} aria-label="Italic">
            <em className="font-serif text-lg">I</em>
        </ToolbarButton>
        <ToolbarButton onExec={() => execCmd('underline')} aria-label="Underline">
            <u className="text-lg">U</u>
        </ToolbarButton>
        <ToolbarButton onExec={() => execCmd('strikethrough')} aria-label="Strikethrough">
            <s className="text-lg">S</s>
        </ToolbarButton>
        <div className="border-l h-5 mx-2"></div>
        <ToolbarButton onExec={() => execCmd('insertUnorderedList')} aria-label="Unordered List">
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
        </ToolbarButton>
        <ToolbarButton onExec={() => execCmd('insertOrderedList')} aria-label="Ordered List">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12h10M7 6h10M7 18h10M4 6h.01M4 12h.01M4 18h.01"></path></svg>
        </ToolbarButton>
      </div>

      {/* Editable Area */}
      <div
        ref={editorRef}
        onInput={handleInput}
        contentEditable={true}
        className="w-full flex-grow p-4 bg-white rounded-b-lg overflow-y-auto focus:outline-none"
        style={{ minHeight: '50vh' }}
        aria-label="Document content editor"
      />
    </div>
  );
};

export default RichTextEditor;
