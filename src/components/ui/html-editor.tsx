import { useState, useMemo, useRef, useEffect, useCallback, lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Code, Eye, Columns, Type, Bold, Italic, Underline as UnderlineIcon,
  Heading1, Heading2, Heading3, Link, Unlink,
  List, ListOrdered, Quote, Minus, AlignLeft, AlignCenter, AlignRight,
  Palette, Highlighter, Undo, Redo, PaintBucket, AlertTriangle,
} from 'lucide-react';
import DOMPurify from 'dompurify';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapUnderline from '@tiptap/extension-underline';
import TiptapLink from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';

const CodeMirror = lazy(() => import('@uiw/react-codemirror'));

// ─── Detect if content has <style> blocks ──────────────────────────────────
const hasStyleBlocks = (html: string) => /<style[\s>]/i.test(html);

// ─── Extract all color values from HTML/CSS ────────────────────────────────
interface ColorMatch {
  value: string;       // e.g. "#ccc" or "rgba(0,0,0,0.3)"
  normalized: string;  // lowercase for deduplication
  count: number;
  contexts: string[];  // short snippets showing where the color appears
}

const extractColors = (html: string): ColorMatch[] => {
  const colorMap = new Map<string, ColorMatch>();
  // Match hex colors, rgb/rgba, hsl/hsla, and named CSS color properties
  const colorRegex = /#(?:[0-9a-fA-F]{3,8})\b|rgba?\([^)]+\)|hsla?\([^)]+\)/g;
  let match;
  while ((match = colorRegex.exec(html)) !== null) {
    const value = match[0];
    const normalized = value.toLowerCase();
    const existing = colorMap.get(normalized);
    // Get surrounding context (30 chars each side)
    const start = Math.max(0, match.index - 30);
    const end = Math.min(html.length, match.index + value.length + 30);
    const context = html.slice(start, end).replace(/\n/g, ' ').trim();
    if (existing) {
      existing.count++;
      if (existing.contexts.length < 3) existing.contexts.push(context);
    } else {
      colorMap.set(normalized, { value, normalized, count: 1, contexts: [context] });
    }
  }
  return Array.from(colorMap.values()).sort((a, b) => b.count - a.count);
};

// ─── Color Replace Panel ───────────────────────────────────────────────────
const ColorReplacePanel = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const colors = useMemo(() => extractColors(value), [value]);
  const [replacingColor, setReplacingColor] = useState<string | null>(null);
  const [newColor, setNewColor] = useState('#000000');

  const handleReplace = (oldColor: string) => {
    // Replace all occurrences (case-insensitive)
    const escaped = oldColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    onChange(value.replace(regex, newColor));
    setReplacingColor(null);
  };

  if (colors.length === 0) {
    return <p className="text-sm text-muted-foreground p-2">No color values found in content.</p>;
  }

  return (
    <div className="space-y-1 max-h-[400px] overflow-auto">
      <p className="text-xs font-medium text-gray-500 px-1 mb-2">
        {colors.length} unique color{colors.length !== 1 ? 's' : ''} found. Click to replace.
      </p>
      {colors.map((c) => (
        <div key={c.normalized} className="flex items-center gap-2 px-1 py-1 hover:bg-gray-50 rounded">
          <div
            className="w-6 h-6 rounded border border-gray-300 flex-shrink-0"
            style={{ backgroundColor: c.value }}
          />
          <div className="flex-1 min-w-0">
            <code className="text-xs font-mono">{c.value}</code>
            <span className="text-xs text-gray-400 ml-1">×{c.count}</span>
            <div className="text-[10px] text-gray-400 truncate">{c.contexts[0]}</div>
          </div>
          {replacingColor === c.normalized ? (
            <div className="flex items-center gap-1">
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="w-7 h-7 cursor-pointer border-0 p-0"
              />
              <Button type="button" size="sm" className="h-6 text-xs px-2" onClick={() => handleReplace(c.value)}>
                Apply
              </Button>
              <Button type="button" size="sm" variant="ghost" className="h-6 text-xs px-1" onClick={() => setReplacingColor(null)}>
                ✕
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-6 text-xs px-2"
              onClick={() => { setReplacingColor(c.normalized); setNewColor(c.value.length <= 7 ? c.value : '#000000'); }}
            >
              Replace
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};

interface HtmlEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

type ViewMode = 'rich' | 'code' | 'split' | 'preview';

const TEXT_COLORS = [
  '#000000', '#1a1a1a', '#555555', '#888888',
  '#dc2626', '#ea580c', '#d97706', '#16a34a',
  '#2563eb', '#7c3aed', '#db2777', '#0d9488',
  '#ffffff', '#f5f5f5',
];

const HIGHLIGHT_COLORS = [
  '#fef08a', '#bbf7d0', '#bfdbfe', '#e9d5ff',
  '#fecdd3', '#fed7aa', '#d1fae5', '#dbeafe',
];

// ─── Rich Text Toolbar ─────────────────────────────────────────────────────
const RichTextToolbar = ({ editor }: { editor: ReturnType<typeof useEditor> }) => {
  const [linkUrl, setLinkUrl] = useState('');

  if (!editor) return null;

  const ToolBtn = ({ icon: Icon, label, active, onClick, className }: {
    icon: React.ElementType; label: string; active?: boolean; onClick: () => void; className?: string;
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={`p-1.5 rounded transition-colors ${
            active ? 'bg-primary/15 text-primary' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
          } ${className || ''}`}
          onClick={onClick}
        >
          <Icon className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent><p>{label}</p></TooltipContent>
    </Tooltip>
  );

  const Divider = () => <div className="w-px bg-gray-300 mx-1 self-stretch" />;

  const setLink = () => {
    if (linkUrl) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    }
    setLinkUrl('');
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-1.5 bg-gray-50 border rounded-t-lg">
      <TooltipProvider delayDuration={300}>
        {/* Undo/Redo */}
        <ToolBtn icon={Undo} label="Undo" onClick={() => editor.chain().focus().undo().run()} />
        <ToolBtn icon={Redo} label="Redo" onClick={() => editor.chain().focus().redo().run()} />

        <Divider />

        {/* Text formatting */}
        <ToolBtn icon={Bold} label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} />
        <ToolBtn icon={Italic} label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />
        <ToolBtn icon={UnderlineIcon} label="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} />

        <Divider />

        {/* Headings */}
        <ToolBtn icon={Heading1} label="Heading 1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} />
        <ToolBtn icon={Heading2} label="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
        <ToolBtn icon={Heading3} label="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />

        <Divider />

        {/* Lists */}
        <ToolBtn icon={List} label="Bullet List" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} />
        <ToolBtn icon={ListOrdered} label="Numbered List" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
        <ToolBtn icon={Quote} label="Blockquote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
        <ToolBtn icon={Minus} label="Horizontal Rule" onClick={() => editor.chain().focus().setHorizontalRule().run()} />

        <Divider />

        {/* Alignment */}
        <ToolBtn icon={AlignLeft} label="Align Left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} />
        <ToolBtn icon={AlignCenter} label="Align Center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} />
        <ToolBtn icon={AlignRight} label="Align Right" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} />

        <Divider />

        {/* Text color */}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="p-1.5 rounded text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors">
              <Palette className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <p className="text-xs font-medium text-gray-500 mb-1.5">Text Color</p>
            <div className="grid grid-cols-7 gap-1">
              {TEXT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => editor.chain().focus().setColor(color).run()}
                />
              ))}
            </div>
            <button
              type="button"
              className="mt-1.5 text-xs text-gray-500 hover:text-gray-700"
              onClick={() => editor.chain().focus().unsetColor().run()}
            >
              Remove color
            </button>
          </PopoverContent>
        </Popover>

        {/* Highlight */}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="p-1.5 rounded text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors">
              <Highlighter className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <p className="text-xs font-medium text-gray-500 mb-1.5">Highlight</p>
            <div className="grid grid-cols-4 gap-1">
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
                />
              ))}
            </div>
            <button
              type="button"
              className="mt-1.5 text-xs text-gray-500 hover:text-gray-700"
              onClick={() => editor.chain().focus().unsetHighlight().run()}
            >
              Remove highlight
            </button>
          </PopoverContent>
        </Popover>

        <Divider />

        {/* Link */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={`p-1.5 rounded transition-colors ${
                editor.isActive('link') ? 'bg-primary/15 text-primary' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
            >
              <Link className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-2" align="start">
            <div className="flex gap-1">
              <Input
                placeholder="https://..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setLink()}
                className="h-8 text-sm"
              />
              <Button type="button" size="sm" className="h-8" onClick={setLink}>Set</Button>
            </div>
          </PopoverContent>
        </Popover>
        {editor.isActive('link') && (
          <ToolBtn icon={Unlink} label="Remove Link" onClick={() => editor.chain().focus().unsetLink().run()} />
        )}
      </TooltipProvider>
    </div>
  );
};

// ─── TipTap Editor Styles ───────────────────────────────────────────────────
const tiptapStyles = `
.tiptap-editor .ProseMirror {
  min-height: 500px;
  max-height: 700px;
  overflow-y: auto;
  padding: 1.5rem;
  outline: none;
  font-size: 16px;
  line-height: 1.7;
}
.tiptap-editor .ProseMirror p { margin: 0 0 1rem; }
.tiptap-editor .ProseMirror h1 { font-size: 28px; font-weight: 700; margin: 2rem 0 0.75rem; }
.tiptap-editor .ProseMirror h2 { font-size: 22px; font-weight: 600; margin: 1.75rem 0 0.5rem; }
.tiptap-editor .ProseMirror h3 { font-size: 18px; font-weight: 600; margin: 1.5rem 0 0.5rem; }
.tiptap-editor .ProseMirror ul, .tiptap-editor .ProseMirror ol { padding-left: 1.5rem; margin: 0 0 1rem; }
.tiptap-editor .ProseMirror li { margin: 0.25rem 0; }
.tiptap-editor .ProseMirror blockquote { border-left: 3px solid #d1d5db; padding-left: 1rem; color: #6b7280; margin: 1rem 0; }
.tiptap-editor .ProseMirror hr { border: none; border-top: 1px solid #e5e7eb; margin: 1.5rem 0; }
.tiptap-editor .ProseMirror a { color: #2563eb; text-decoration: underline; }
.tiptap-editor .ProseMirror mark { border-radius: 2px; padding: 0 2px; }
.tiptap-editor .ProseMirror code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 14px; }
.tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
  color: #adb5bd;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
`;

// ─── Main Component ─────────────────────────────────────────────────────────
export const HtmlEditor: React.FC<HtmlEditorProps> = ({ value, onChange, placeholder }) => {
  const isStyled = useMemo(() => hasStyleBlocks(value), [value]);
  const [mode, setMode] = useState<ViewMode>(() => hasStyleBlocks(value) ? 'split' : 'rich');
  const [extensions, setExtensions] = useState<any[]>([]);
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const isUpdatingFromCode = useRef(false);
  const isUpdatingFromTiptap = useRef(false);

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

  // TipTap editor
  const tiptapEditor = useEditor({
    extensions: [
      StarterKit,
      TiptapUnderline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TiptapLink.configure({ openOnClick: false }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      if (isUpdatingFromCode.current) return;
      isUpdatingFromTiptap.current = true;
      onChange(editor.getHTML());
      requestAnimationFrame(() => { isUpdatingFromTiptap.current = false; });
    },
  });

  // Sync value → TipTap when switching to rich mode or when code changes value
  useEffect(() => {
    if (tiptapEditor && !isUpdatingFromTiptap.current && mode === 'rich') {
      const currentHtml = tiptapEditor.getHTML();
      if (currentHtml !== value) {
        isUpdatingFromCode.current = true;
        tiptapEditor.commands.setContent(value || '', { emitUpdate: false });
        isUpdatingFromCode.current = false;
      }
    }
  }, [value, tiptapEditor, mode]);

  // When switching to rich mode, sync content
  const handleModeChange = useCallback((newMode: ViewMode) => {
    if (newMode === 'rich' && tiptapEditor) {
      isUpdatingFromCode.current = true;
      tiptapEditor.commands.setContent(value || '', { emitUpdate: false });
      isUpdatingFromCode.current = false;
    }
    setMode(newMode);
  }, [tiptapEditor, value]);

  const handleCodeChange = useCallback((val: string) => {
    onChange(val);
  }, [onChange]);

  return (
    <div className="space-y-2">
      <style>{tiptapStyles}</style>

      {/* Top bar: label + view mode toggles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Content</span>
          {/* Color replace tool — works on raw HTML in any mode */}
          {(mode === 'code' || mode === 'split') && (
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1">
                  <PaintBucket className="h-3.5 w-3.5" />
                  Colors
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-2" align="start">
                <ColorReplacePanel value={value} onChange={onChange} />
              </PopoverContent>
            </Popover>
          )}
        </div>
        <div className="flex gap-1">
          <Button type="button" variant={mode === 'rich' ? 'default' : 'outline'} size="sm" onClick={() => handleModeChange('rich')}>
            <Type className="h-3.5 w-3.5 mr-1" />Rich Text
          </Button>
          <Button type="button" variant={mode === 'code' ? 'default' : 'outline'} size="sm" onClick={() => handleModeChange('code')}>
            <Code className="h-3.5 w-3.5 mr-1" />Code
          </Button>
          <Button type="button" variant={mode === 'split' ? 'default' : 'outline'} size="sm" onClick={() => handleModeChange('split')}>
            <Columns className="h-3.5 w-3.5 mr-1" />Split
          </Button>
          <Button type="button" variant={mode === 'preview' ? 'default' : 'outline'} size="sm" onClick={() => handleModeChange('preview')}>
            <Eye className="h-3.5 w-3.5 mr-1" />Preview
          </Button>
        </div>
      </div>

      {/* Warning when switching to Rich Text with styled content */}
      {mode === 'rich' && isStyled && (
        <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
          <span>This content uses <code>&lt;style&gt;</code> blocks and custom CSS classes. <strong>Split</strong> or <strong>Code</strong> mode will show the actual formatting. Rich Text mode may lose some styling.</span>
        </div>
      )}

      {/* Rich Text mode */}
      {mode === 'rich' && (
        <>
          <RichTextToolbar editor={tiptapEditor} />
          <div className="tiptap-editor border rounded-b-lg border-t-0 overflow-hidden bg-white">
            <EditorContent editor={tiptapEditor} />
          </div>
        </>
      )}

      {/* Code / Split / Preview modes */}
      {mode !== 'rich' && (
        <div className={`border rounded-lg overflow-hidden ${mode === 'split' ? 'grid grid-cols-2' : ''}`}>
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
                  onChange={handleCodeChange}
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
      )}
    </div>
  );
};
