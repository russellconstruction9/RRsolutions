
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
    <div className="w-full h-full flex flex-col border border-slate-300/60 rounded-2xl shadow-inner focus-within:ring-2 focus-within:ring-brand-500/50 focus-within:border-brand-400 transition-all duration-300 overflow-hidden bg-white/50 backdrop-blur-sm">
      {/* Toolbar */}
      <div className="flex items-center p-4 border-b border-slate-200/60 bg-gradient-to-r from-slate-50/80 to-slate-100/60 backdrop-blur-sm">
        <ToolbarButton onExec={() => execCmd('bold')} aria-label="Bold">
           <strong className="font-bold text-lg text-slate-700">B</strong>
        </ToolbarButton>
        <ToolbarButton onExec={() => execCmd('italic')} aria-label="Italic">
            <em className="font-serif text-lg text-slate-700">I</em>
        </ToolbarButton>
        <ToolbarButton onExec={() => execCmd('underline')} aria-label="Underline">
            <u className="text-lg text-slate-700">U</u>
        </ToolbarButton>
        <ToolbarButton onExec={() => execCmd('strikethrough')} aria-label="Strikethrough">
            <s className="text-lg text-slate-700">S</s>
        </ToolbarButton>
        <div className="border-l border-slate-300 h-6 mx-3"></div>
        <ToolbarButton onExec={() => execCmd('insertUnorderedList')} aria-label="Unordered List">
           <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
        </ToolbarButton>
        <ToolbarButton onExec={() => execCmd('insertOrderedList')} aria-label="Ordered List">
          <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12h10M7 6h10M7 18h10M4 6h.01M4 12h.01M4 18h.01"></path></svg>
        </ToolbarButton>
      </div>

      {/* Editable Area */}
      <div
        ref={editorRef}
        onInput={handleInput}
        contentEditable={true}
        className="w-full flex-grow p-6 bg-white/80 backdrop-blur-sm overflow-y-auto focus:outline-none text-slate-800 leading-relaxed"
        style={{ minHeight: '55vh' }}
        aria-label="Document content editor"
      />
    </div>
  );
};

export default RichTextEditor;
