import { useState, useMemo, useRef, useCallback, lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Code, Eye, Columns, Bold, Italic, Heading1, Heading2, Heading3,
  Link, List, ListOrdered, Quote, Minus, Image as ImageIcon, Table,
} from 'lucide-react';
import DOMPurify from 'dompurify';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';

const CodeMirror = lazy(() => import('@uiw/react-codemirror'));

interface HtmlEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

type ViewMode = 'code' | 'preview' | 'split';

interface ToolbarAction {
  icon: React.ElementType;
  label: string;
  before: string;
  after: string;
  block?: boolean;
}

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  { icon: Bold, label: 'Bold', before: '<strong>', after: '</strong>' },
  { icon: Italic, label: 'Italic', before: '<em>', after: '</em>' },
  { icon: Heading1, label: 'Heading 1', before: '<h1>', after: '</h1>', block: true },
  { icon: Heading2, label: 'Heading 2', before: '<h2>', after: '</h2>', block: true },
  { icon: Heading3, label: 'Heading 3', before: '<h3>', after: '</h3>', block: true },
  { icon: Link, label: 'Link', before: '<a href="">', after: '</a>' },
  { icon: ImageIcon, label: 'Image', before: '<img src="', after: '" alt="" />' },
  { icon: List, label: 'Bullet List', before: '<ul>\n  <li>', after: '</li>\n</ul>', block: true },
  { icon: ListOrdered, label: 'Numbered List', before: '<ol>\n  <li>', after: '</li>\n</ol>', block: true },
  { icon: Quote, label: 'Blockquote', before: '<blockquote>', after: '</blockquote>', block: true },
  { icon: Minus, label: 'Horizontal Rule', before: '<hr />', after: '', block: true },
  { icon: Table, label: 'Table', before: '<table>\n  <tr>\n    <td>', after: '</td>\n    <td></td>\n  </tr>\n</table>', block: true },
];

const PARAGRAPH_WRAP: ToolbarAction = {
  icon: Code, label: 'Paragraph', before: '<p>', after: '</p>', block: true,
};

export const HtmlEditor: React.FC<HtmlEditorProps> = ({ value, onChange, placeholder }) => {
  const [mode, setMode] = useState<ViewMode>('split');
  const [extensions, setExtensions] = useState<any[]>([]);
  const editorRef = useRef<ReactCodeMirrorRef>(null);

  // Lazy-load CodeMirror extensions
  useMemo(() => {
    Promise.all([
      import('@codemirror/lang-html'),
      import('@codemirror/lang-css'),
    ]).then(([htmlMod, cssMod]) => {
      setExtensions([htmlMod.html({ matchClosingTags: true }), cssMod.css()]);
    });
  }, []);

  const sanitizedHtml = useMemo(
    () => DOMPurify.sanitize(value || '', { ADD_TAGS: ['style'], ADD_ATTR: ['style'], FORCE_BODY: true }),
    [value]
  );

  const applyAction = useCallback((action: ToolbarAction) => {
    const view = editorRef.current?.view;
    if (!view) {
      // Fallback: append at end
      const newLine = action.block ? '\n' : '';
      onChange(value + newLine + action.before + (action.after ? 'text' + action.after : '') + newLine);
      return;
    }

    const { from, to } = view.state.selection.main;
    const selected = view.state.sliceDoc(from, to);
    const replacement = action.before + (selected || (action.after ? 'text' : '')) + action.after;
    const newLine = action.block ? '\n' : '';

    // Build new value
    const before = value.slice(0, from);
    const after = value.slice(to);
    const insert = newLine + replacement + newLine;
    const newValue = before + insert + after;
    onChange(newValue);

    // Place cursor inside the inserted tags
    requestAnimationFrame(() => {
      const cursorPos = from + newLine.length + action.before.length + (selected ? selected.length : (action.after ? 4 : 0));
      view.dispatch({
        selection: { anchor: cursorPos },
      });
      view.focus();
    });
  }, [value, onChange]);

  return (
    <div className="space-y-2">
      {/* Top bar: label + view mode toggles */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Content</span>
        <div className="flex gap-1">
          <Button type="button" variant={mode === 'code' ? 'default' : 'outline'} size="sm" onClick={() => setMode('code')}>
            <Code className="h-3.5 w-3.5 mr-1" />Code
          </Button>
          <Button type="button" variant={mode === 'split' ? 'default' : 'outline'} size="sm" onClick={() => setMode('split')}>
            <Columns className="h-3.5 w-3.5 mr-1" />Split
          </Button>
          <Button type="button" variant={mode === 'preview' ? 'default' : 'outline'} size="sm" onClick={() => setMode('preview')}>
            <Eye className="h-3.5 w-3.5 mr-1" />Preview
          </Button>
        </div>
      </div>

      {/* Formatting toolbar */}
      {mode !== 'preview' && (
        <div className="flex flex-wrap gap-0.5 p-1.5 bg-gray-50 border rounded-t-lg">
          <TooltipProvider delayDuration={300}>
            {/* Paragraph button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="p-1.5 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors text-xs font-semibold px-2"
                  onClick={() => applyAction(PARAGRAPH_WRAP)}
                >
                  &lt;p&gt;
                </button>
              </TooltipTrigger>
              <TooltipContent><p>Wrap in paragraph</p></TooltipContent>
            </Tooltip>

            <div className="w-px bg-gray-300 mx-1 self-stretch" />

            {TOOLBAR_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Tooltip key={action.label}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="p-1.5 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
                      onClick={() => applyAction(action)}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent><p>{action.label}</p></TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>
      )}

      {/* Editor + Preview */}
      <div className={`border ${mode !== 'preview' ? 'rounded-b-lg border-t-0' : 'rounded-lg'} overflow-hidden ${mode === 'split' ? 'grid grid-cols-2' : ''}`}>
        {/* Code editor */}
        {mode !== 'preview' && (
          <div className={`${mode === 'split' ? 'border-r' : ''} min-h-[500px] max-h-[700px] overflow-auto`}>
            <Suspense fallback={
              <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full h-[500px] p-4 font-mono text-sm bg-gray-50 border-none resize-none focus:outline-none"
              />
            }>
              <CodeMirror
                ref={editorRef}
                value={value}
                onChange={onChange}
                extensions={extensions}
                placeholder={placeholder}
                height="500px"
                maxHeight="700px"
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: true,
                  bracketMatching: true,
                  closeBrackets: true,
                  autocompletion: true,
                  highlightActiveLine: true,
                  indentOnInput: true,
                }}
              />
            </Suspense>
          </div>
        )}

        {/* Preview */}
        {mode !== 'code' && (
          <div
            className="min-h-[500px] max-h-[700px] overflow-auto p-6 bg-white"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />
        )}
      </div>
    </div>
  );
};
