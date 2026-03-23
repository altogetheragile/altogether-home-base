import { useState } from 'react';
import { Link, useMatch } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff, ChevronDown, ChevronRight, Check, X } from 'lucide-react';
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

/* ── Main AdminBlog Page ── */
const AdminBlog = () => {
  const match = useMatch('/admin/blog');
  const shouldRender = !!match;

  const { data: posts, isLoading, error } = useAdminBlogPosts();
  const { deletePost, togglePublished } = useBlogPostMutations();
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

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
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPosts.map((post) => (
                <TableRow key={post.id}>
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
                        onClick={() =>
                          togglePublished.mutate({
                            id: post.id,
                            is_published: post.is_published,
                          })
                        }
                        disabled={togglePublished.isPending}
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
                        onClick={() => setDeletePostId(post.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPosts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No blog posts found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
