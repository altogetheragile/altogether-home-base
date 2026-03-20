import { useState, useMemo, lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Code, Eye, Columns } from 'lucide-react';
import DOMPurify from 'dompurify';

const CodeMirror = lazy(() => import('@uiw/react-codemirror'));

interface HtmlEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

type ViewMode = 'code' | 'preview' | 'split';

export const HtmlEditor: React.FC<HtmlEditorProps> = ({ value, onChange, placeholder }) => {
  const [mode, setMode] = useState<ViewMode>('split');
  const [extensions, setExtensions] = useState<any[]>([]);

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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Content</span>
        <div className="flex gap-1">
          <Button
            type="button"
            variant={mode === 'code' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('code')}
          >
            <Code className="h-3.5 w-3.5 mr-1" />
            Code
          </Button>
          <Button
            type="button"
            variant={mode === 'split' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('split')}
          >
            <Columns className="h-3.5 w-3.5 mr-1" />
            Split
          </Button>
          <Button
            type="button"
            variant={mode === 'preview' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('preview')}
          >
            <Eye className="h-3.5 w-3.5 mr-1" />
            Preview
          </Button>
        </div>
      </div>

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
