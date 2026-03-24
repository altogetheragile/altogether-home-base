import { useState } from 'react';
import { Link, useMatch } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff, ChevronDown, ChevronRight, Check, X, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAdminBlogPosts, useBlogPostMutations } from '@/hooks/useAdminBlogPosts';
import { useBlogCategories, useBlogCategoryMutations, type BlogCategory } from '@/hooks/useBlogCategories';
import { ImportMarkdownDialog } from '@/components/admin/ImportMarkdownDialog';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { BlogPost } from '@/hooks/useBlogPosts';

type StatusFilter = 'all' | 'published' | 'drafts';

const generateSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* ── Category Management Panel ── */
const CategoryPanel = () => {
  const { data: categories } = useBlogCategories();
  const { createCategory, updateCategory, deleteCategory } = useBlogCategoryMutations();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', slug: '', color: '', description: '' });
  const [newForm, setNewForm] = useState({ name: '', color: '#B2DFDB' });
  const [deleteCatId, setDeleteCatId] = useState<string | null>(null);

  const startEdit = (cat: BlogCategory) => {
    setEditingId(cat.id);
    setEditForm({ name: cat.name, slug: cat.slug, color: cat.color, description: cat.description || '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = () => {
    if (!editingId || !editForm.name.trim()) return;
    updateCategory.mutate({ id: editingId, data: editForm });
    setEditingId(null);
  };

  const handleCreate = () => {
    if (!newForm.name.trim()) return;
    createCategory.mutate({
      name: newForm.name.trim(),
      slug: generateSlug(newForm.name),
      color: newForm.color,
    });
    setNewForm({ name: '', color: '#B2DFDB' });
  };

  const handleDelete = () => {
    if (!deleteCatId) return;
    deleteCategory.mutate(deleteCatId);
    setDeleteCatId(null);
  };

  return (
    <>
      <Card>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span className="font-semibold">Manage Categories</span>
            <Badge variant="secondary" className="ml-2">{categories?.length || 0}</Badge>
          </div>
        </button>

        {isOpen && (
          <div className="border-t px-4 pb-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">Colour</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(categories || []).map((cat) => (
                  <TableRow key={cat.id}>
                    {editingId === cat.id ? (
                      <>
                        <TableCell>
                          <input
                            type="color"
                            value={editForm.color}
                            onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                            className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={editForm.name}
                            onChange={(e) => setEditForm({
                              ...editForm,
                              name: e.target.value,
                              slug: generateSlug(e.target.value),
                            })}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{editForm.slug}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={saveEdit}>
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={cancelEdit}>
                              <X className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>
                          <div
                            className="w-6 h-6 rounded-full border"
                            style={{ backgroundColor: cat.color }}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{cat.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{cat.slug}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => startEdit(cat)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteCatId(cat.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}

                {/* Add new row */}
                <TableRow>
                  <TableCell>
                    <input
                      type="color"
                      value={newForm.color}
                      onChange={(e) => setNewForm({ ...newForm, color: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={newForm.name}
                      onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                      placeholder="New category name"
                      className="h-8"
                      onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {newForm.name ? generateSlug(newForm.name) : '—'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCreate}
                      disabled={!newForm.name.trim() || createCategory.isPending}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <AlertDialog open={!!deleteCatId} onOpenChange={(open) => { if (!open) setDeleteCatId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the category from all posts that use it. The posts themselves will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

/* ── Sortable Blog Row ── */
const SortableBlogRow = ({
  post,
  isDndActive,
  onTogglePublish,
  onDelete,
}: {
  post: BlogPost;
  isDndActive: boolean;
  onTogglePublish: (id: string, is_published: boolean) => void;
  onDelete: (id: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: post.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      {isDndActive && (
        <TableCell className="w-8">
          <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground">
            <GripVertical className="h-4 w-4" />
          </button>
        </TableCell>
      )}
      <TableCell className="font-medium max-w-[300px]">
        <span className="block truncate" title={post.title}>{post.title}</span>
      </TableCell>
      <TableCell>
        {post.blog_categories ? (
          <Badge
            variant="outline"
            style={{
              borderColor: post.blog_categories.color,
              color: post.blog_categories.color,
            }}
          >
            {post.blog_categories.name}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </TableCell>
      <TableCell>
        <Badge variant={post.is_published ? 'default' : 'secondary'}>
          {post.is_published ? (
            <><Eye className="h-3 w-3 mr-1" />Published</>
          ) : (
            <><EyeOff className="h-3 w-3 mr-1" />Draft</>
          )}
        </Badge>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {post.published_at
          ? format(new Date(post.published_at), 'MMM dd, yyyy')
          : '—'}
      </TableCell>
      <TableCell>{post.view_count}</TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Link to={`/admin/blog/${post.id}`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onTogglePublish(post.id, post.is_published)}
          >
            {post.is_published ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(post.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

/* ── Main AdminBlog Page ── */
const AdminBlog = () => {
  const match = useMatch('/admin/blog');
  const shouldRender = !!match;

  const { data: posts, isLoading, error } = useAdminBlogPosts();
  const { deletePost, togglePublished } = useBlogPostMutations();
  const queryClient = useQueryClient();
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const isDndActive = statusFilter === 'all';

  const reorderPosts = useMutation({
    mutationFn: async (ordered: { id: string; display_order: number }[]) => {
      const updates = ordered.map(({ id, display_order }) =>
        supabase.from('blog_posts').update({ display_order }).eq('id', id)
      );
      const results = await Promise.all(updates);
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success('Order saved');
    },
    onError: () => {
      toast.error('Failed to save order');
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !posts) return;

    const oldIndex = posts.findIndex((p) => p.id === active.id);
    const newIndex = posts.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(posts, oldIndex, newIndex);

    // Optimistic update
    queryClient.setQueryData(['admin-blog-posts'], reordered);

    // Persist
    reorderPosts.mutate(
      reordered.map((p, i) => ({ id: p.id, display_order: i + 1 }))
    );
  };

  if (!shouldRender) return null;

  const handleDelete = async () => {
    if (!deletePostId) return;
    await deletePost.mutateAsync(deletePostId);
    setDeletePostId(null);
  };

  const filteredPosts = (posts || []).filter((post) => {
    if (statusFilter === 'published') return post.is_published;
    if (statusFilter === 'drafts') return !post.is_published;
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading blog posts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Error loading blog posts</div>
      </div>
    );
  }

  const filterTabs: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Published', value: 'published' },
    { label: 'Drafts', value: 'drafts' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Blog Posts</h1>
        <div className="flex items-center gap-2">
          <ImportMarkdownDialog />
          <Link to="/admin/blog/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </Link>
        </div>
      </div>

      {/* Category management */}
      <CategoryPanel />

      <div className="flex space-x-2">
        {filterTabs.map((tab) => (
          <Button
            key={tab.value}
            variant={statusFilter === tab.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <Card>
        <div className="rounded-md overflow-x-auto">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  {isDndActive && <TableHead className="w-8" />}
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isDndActive ? (
                  <SortableContext items={filteredPosts.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                    {filteredPosts.map((post) => (
                      <SortableBlogRow
                        key={post.id}
                        post={post}
                        isDndActive
                        onTogglePublish={(id, is_published) => togglePublished.mutate({ id, is_published })}
                        onDelete={(id) => setDeletePostId(id)}
                      />
                    ))}
                  </SortableContext>
                ) : (
                  filteredPosts.map((post) => (
                    <SortableBlogRow
                      key={post.id}
                      post={post}
                      isDndActive={false}
                      onTogglePublish={(id, is_published) => togglePublished.mutate({ id, is_published })}
                      onDelete={(id) => setDeletePostId(id)}
                    />
                  ))
                )}
                {filteredPosts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={isDndActive ? 7 : 6} className="text-center text-muted-foreground py-8">
                      No blog posts found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
      </Card>

      <AlertDialog open={!!deletePostId} onOpenChange={(open) => {
        if (!open) setDeletePostId(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this blog post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminBlog;
