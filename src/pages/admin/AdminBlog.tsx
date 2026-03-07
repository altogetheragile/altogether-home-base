import { useState } from 'react';
import { Link, useMatch } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
import { format } from 'date-fns';

type StatusFilter = 'all' | 'published' | 'drafts';

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
        <Link to="/admin/blog/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </Link>
      </div>

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
