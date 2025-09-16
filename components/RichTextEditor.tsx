import React, { useState } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  showFormatting?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  showFormatting = true
}) => {
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  const applyFormat = (format: string) => {
    const textarea = document.getElementById('rich-text-area') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    if (selectedText) {
      let formattedText = '';

      switch (format) {
        case 'bold':
          formattedText = `<b>${selectedText}</b>`;
          break;
        case 'italic':
          formattedText = `<i>${selectedText}</i>`;
          break;
        case 'uppercase':
          formattedText = selectedText.toUpperCase();
          break;
        case 'lowercase':
          formattedText = selectedText.toLowerCase();
          break;
        case 'capitalize':
          formattedText = selectedText.replace(/\b\w/g, l => l.toUpperCase());
          break;
        case 'underline':
          formattedText = `<u>${selectedText}</u>`;
          break;
        default:
          formattedText = selectedText;
      }

      const newValue = value.substring(0, start) + formattedText + value.substring(end);
      onChange(newValue);
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('rich-text-area') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const newValue = value.substring(0, start) + variable + value.substring(end);
    onChange(newValue);

    // Set cursor position after inserted variable
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + variable.length;
      textarea.focus();
    }, 0);
  };

  return (
    <div className="space-y-2">
      {showFormatting && (
        <>
          <div className="flex gap-1 flex-wrap">
            <button
              type="button"
              onClick={() => applyFormat('bold')}
              className="px-2 py-1 text-sm border rounded hover:bg-gray-50"
              title="Bold"
            >
              <b>B</b>
            </button>
            <button
              type="button"
              onClick={() => applyFormat('italic')}
              className="px-2 py-1 text-sm border rounded hover:bg-gray-50"
              title="Italic"
            >
              <i>I</i>
            </button>
            <button
              type="button"
              onClick={() => applyFormat('underline')}
              className="px-2 py-1 text-sm border rounded hover:bg-gray-50"
              title="Underline"
            >
              <u>U</u>
            </button>
            <div className="border-l mx-1" />
            <button
              type="button"
              onClick={() => applyFormat('uppercase')}
              className="px-2 py-1 text-sm border rounded hover:bg-gray-50"
              title="Uppercase"
            >
              AA
            </button>
            <button
              type="button"
              onClick={() => applyFormat('lowercase')}
              className="px-2 py-1 text-sm border rounded hover:bg-gray-50"
              title="Lowercase"
            >
              aa
            </button>
            <button
              type="button"
              onClick={() => applyFormat('capitalize')}
              className="px-2 py-1 text-sm border rounded hover:bg-gray-50"
              title="Capitalize Words"
            >
              Aa
            </button>
          </div>

          <div className="flex gap-1 flex-wrap">
            <span className="text-xs text-gray-500 py-1">Insert:</span>
            <button
              type="button"
              onClick={() => insertVariable('{business_name}')}
              className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
            >
              Business Name
            </button>
            <button
              type="button"
              onClick={() => insertVariable('{city}')}
              className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
            >
              City
            </button>
            <button
              type="button"
              onClick={() => insertVariable('{state}')}
              className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
            >
              State
            </button>
            <button
              type="button"
              onClick={() => insertVariable('{phone}')}
              className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
            >
              Phone
            </button>
          </div>
        </>
      )}

      <textarea
        id="rich-text-area"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onSelect={(e) => {
          const target = e.target as HTMLTextAreaElement;
          setSelection({ start: target.selectionStart, end: target.selectionEnd });
        }}
        className="w-full px-3 py-2 border rounded"
        rows={3}
      />

      <div className="text-xs text-gray-500">
        Select text to format, or click to insert variables
      </div>
    </div>
  );
};