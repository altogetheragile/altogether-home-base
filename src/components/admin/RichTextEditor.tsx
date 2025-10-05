import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Link as LinkIcon, 
  Image as ImageIcon,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Library,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { MediaBrowserDialog } from './MediaBrowserDialog';
import { NodeSelection } from 'prosemirror-state';

interface RichTextEditorProps {
  content?: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);
  const [showMediaBrowser, setShowMediaBrowser] = useState(false);

  if (!editor) return null;

  const addLink = () => {
    if (!linkUrl) return;

    // Ensure the URL has a protocol to prevent relative URL issues
    let normalizedUrl = linkUrl.trim();
    if (!normalizedUrl.match(/^https?:\/\//i)) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    const { from, to } = editor.state.selection;
    if (from === to) {
      // No selection: insert the URL text as a link
      editor
        .chain()
        .focus()
        .insertContent([
          {
            type: 'text',
            text: linkUrl,
            marks: [{ type: 'link', attrs: { href: normalizedUrl } }],
          },
        ])
        .run();
    } else {
      // Selection exists: apply link to the selection
      editor.chain().focus().extendMarkRange('link').setLink({ href: normalizedUrl }).run();
    }

    setLinkUrl('');
    setShowLinkInput(false);
  };

  const addImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setShowImageInput(false);
    }
  };

  const handleMediaSelect = (url: string, mediaId: string) => {
    editor.chain().focus().setImage({ 
      src: url,
      'data-media-id': mediaId,
      width: '400px',
      style: 'max-width: 100%; height: auto;'
    }).run();
    setShowMediaBrowser(false);
  };

  const setImageSize = (size: 'small' | 'medium' | 'large' | 'full') => {
    const sizeMap = {
      small: '300px',
      medium: '500px',
      large: '700px',
      full: '100%'
    };
    
    const currentImage = editor.getAttributes('image');
    if (currentImage.src) {
      editor.chain().focus().updateAttributes('image', { 
        width: sizeMap[size]
      }).run();
    }
  };

  const setImageAlignment = (alignment: 'left' | 'center' | 'right') => {
    const { state } = editor;
    const { selection } = state;
    const node = state.doc.nodeAt(selection.from);
    
    if (node && node.type.name === 'image') {
      const alignmentStyles = {
        left: 'max-width: 100%; height: auto; float: left; margin: 0 1rem 1rem 0;',
        center: 'max-width: 100%; height: auto; display: block; margin: 1rem auto;',
        right: 'max-width: 100%; height: auto; float: right; margin: 0 0 1rem 1rem;'
      };
      
      editor.chain().focus().updateAttributes('image', { 
        style: alignmentStyles[alignment]
      }).run();
    }
  };

  const setTextAlignment = (alignment: 'left' | 'center' | 'right' | 'justify') => {
    editor.chain().focus().setTextAlign(alignment).run();
  };

  const handleAlignClick = (alignment: 'left' | 'center' | 'right') => {
    const { state } = editor;
    const node = state.doc.nodeAt(state.selection.from);
    if (node && node.type.name === 'image') {
      setImageAlignment(alignment);
    } else {
      setTextAlignment(alignment);
    }
  };

  return (
    <div className="border-b border-border p-2 flex flex-wrap gap-1">
      <Button
        variant={editor.isActive('bold') ? 'default' : 'ghost'}
        size="sm"
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </Button>
      
      <Button
        variant={editor.isActive('italic') ? 'default' : 'ghost'}
        size="sm"
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </Button>
      
      <Button
        variant={editor.isActive('strike') ? 'default' : 'ghost'}
        size="sm"
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      
      <div className="w-px h-6 bg-border mx-1" />
      
      <Button
        variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
        size="sm"
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </Button>
      
      <Button
        variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
        size="sm"
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      
      <Button
        variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
        size="sm"
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-4 w-4" />
      </Button>
      
      <div className="w-px h-6 bg-border mx-1" />
      
      <Button
        variant="ghost"
        size="sm"
        type="button"
        onClick={() => setShowLinkInput(!showLinkInput)}
      >
        <LinkIcon className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        type="button"
        onClick={() => setShowImageInput(!showImageInput)}
      >
        <ImageIcon className="h-4 w-4" />
      </Button>
      
      <div className="w-px h-6 bg-border mx-1" />
      
      <Button
        variant="ghost"
        size="sm"
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo className="h-4 w-4" />
      </Button>
      
      <div className="w-px h-6 bg-border mx-1" />
      
      <Button
        variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
        size="sm"
        type="button"
        onClick={() => handleAlignClick('left')}
        title="Align Text Left"
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      
      <Button
        variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
        size="sm"
        type="button"
        onClick={() => handleAlignClick('center')}
        title="Align Text Center"
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      
      <Button
        variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
        size="sm"
        type="button"
        onClick={() => handleAlignClick('right')}
        title="Align Text Right"
      >
        <AlignRight className="h-4 w-4" />
      </Button>
      
      <div className="w-px h-6 bg-border mx-1" />
      
      <Button
        variant="ghost"
        size="sm"
        type="button"
        onClick={() => setImageSize('small')}
        title="Small (300px)"
      >
        S
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        type="button"
        onClick={() => setImageSize('medium')}
        title="Medium (500px)"
      >
        M
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        type="button"
        onClick={() => setImageSize('large')}
        title="Large (700px)"
      >
        L
      </Button>
      
      {showLinkInput && (
        <div className="flex items-center gap-2 ml-4">
          <Input
            type="url"
            placeholder="Enter URL"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="w-48"
            onKeyDown={(e) => e.key === 'Enter' && addLink()}
          />
          <Button size="sm" type="button" onClick={addLink}>Add</Button>
        </div>
      )}
      
      {showImageInput && (
        <div className="flex items-center gap-2 ml-4">
          <Tabs defaultValue="url" className="w-full">
            <TabsList>
              <TabsTrigger value="library">Browse Library</TabsTrigger>
              <TabsTrigger value="url">URL</TabsTrigger>
            </TabsList>
            <TabsContent value="library" className="mt-2">
              <Button 
                size="sm" 
                type="button"
                onClick={() => setShowMediaBrowser(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Library className="h-4 w-4" />
                Open Media Library
              </Button>
            </TabsContent>
            <TabsContent value="url" className="mt-2 flex items-center gap-2">
              <Input
                type="url"
                placeholder="Enter image URL"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-64"
                onKeyDown={(e) => e.key === 'Enter' && addImage()}
              />
              <Button size="sm" type="button" onClick={addImage}>Add</Button>
            </TabsContent>
          </Tabs>
        </div>
      )}
      
      <MediaBrowserDialog
        open={showMediaBrowser}
        onOpenChange={setShowMediaBrowser}
        onSelect={handleMediaSelect}
        filterType="image"
      />
    </div>
  );
};

export const RichTextEditor = ({ content = '', onChange, placeholder }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class: 'editor-link',
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: false,
        HTMLAttributes: {
          class: 'editor-image',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4',
      },
      handleClickOn: (view: any, pos: any, node: any, nodePos: any, event: any, direct: any) => {
        if (node?.type?.name === 'image') {
          const tr = view.state.tr.setSelection(NodeSelection.create(view.state.doc, nodePos));
          view.dispatch(tr);
          return true;
        }
        return false;
      },
    },
  });

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <style>{`
        .editor-image {
          max-width: 100%;
          height: auto;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .editor-image:hover {
          opacity: 0.8;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
        }
        .ProseMirror ul {
          list-style: disc;
          padding-left: 1.25rem;
          margin: 0.5rem 0;
        }
        .ProseMirror ol {
          list-style: decimal;
          padding-left: 1.25rem;
          margin: 0.5rem 0;
        }
        .ProseMirror li {
          margin: 0.25rem 0;
        }
        .ProseMirror p {
          margin: 0.5rem 0;
        }
        .ProseMirror a {
          color: hsl(var(--primary));
          text-decoration: underline;
          text-underline-offset: 2px;
          cursor: pointer;
          pointer-events: auto;
        }
        .ProseMirror a:hover {
          opacity: 0.9;
          text-decoration-thickness: 2px;
        }
        /* Show clear selection outline for images/nodes */
        .ProseMirror-selectednode,
        img.ProseMirror-selectednode {
          outline: 2px solid hsl(var(--primary));
          outline-offset: 2px;
        }
      `}</style>
      <MenuBar editor={editor} />
      <EditorContent 
        editor={editor} 
        placeholder={placeholder}
      />
    </div>
  );
};