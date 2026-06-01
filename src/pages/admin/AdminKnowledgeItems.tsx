import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Plus, Search } from 'lucide-react';
import { useKnowledgeItems } from '@/hooks/useKnowledgeItems';

type TypeFilter = 'all' | 'artifact' | 'technique' | 'other';

const AdminKnowledgeItems = () => {
  const navigate = useNavigate();
  const { data: items, isLoading, isError } = useKnowledgeItems({
    showUnpublished: true,
    limit: 1000,
    sortBy: 'alphabetical',
  });
  const [query, setQuery] = useState('');
  const [type, setType] = useState<TypeFilter>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (items || []).filter((i) => {
      const matchesQuery = !q || i.name.toLowerCase().includes(q) || i.slug.toLowerCase().includes(q);
      const t = i.item_type || 'other';
      const matchesType =
        type === 'all' ||
        (type === 'artifact' && t === 'artifact') ||
        (type === 'technique' && t === 'technique') ||
        (type === 'other' && t !== 'artifact' && t !== 'technique');
      return matchesQuery && matchesType;
    });
  }, [items, query, type]);

  return (
    <div className="container mx-auto py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Items</h1>
          <p className="text-sm text-muted-foreground">
            Browse and edit artifacts and techniques. Edits write to live data.
          </p>
        </div>
        <Button onClick={() => navigate('/admin/knowledge/items/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Item
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-grow max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or slug…"
            className="pl-9 h-9"
          />
        </div>
        {(['all', 'artifact', 'technique', 'other'] as TypeFilter[]).map((t) => (
          <Button
            key={t}
            size="sm"
            variant={type === t ? 'default' : 'outline'}
            onClick={() => setType(t)}
            className="capitalize"
          >
            {t}
          </Button>
        ))}
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} items</span>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {isError && <p className="text-destructive">Failed to load knowledge items. Check admin access.</p>}

      <Card>
        <CardContent className="p-0 divide-y">
          {filtered.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40">
              <div className="min-w-0 flex-grow">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{item.name}</span>
                  {!item.is_published && (
                    <Badge variant="outline" className="text-amber-600 border-amber-300">Draft</Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate">{item.slug}</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {item.item_type && <Badge variant="secondary" className="capitalize">{item.item_type}</Badge>}
                {item.horizon && <Badge variant="outline">{item.horizon}</Badge>}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate(`/admin/knowledge/items/${item.id}/edit`)}
              >
                <Pencil className="h-4 w-4 mr-1.5" />
                Edit
              </Button>
            </div>
          ))}
          {!isLoading && filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-muted-foreground text-sm">No items match.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminKnowledgeItems;
