import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ClipboardList, 
  Plus, 
  Package,
  ArrowLeft
} from 'lucide-react';
import { BacklogQuickAdd } from '@/components/backlog/BacklogQuickAdd';
import { BacklogList } from '@/components/backlog/BacklogList';
import { 
  useProducts, 
  useBacklogItems, 
  useCreateProduct,
  Product 
} from '@/hooks/useBacklogItems';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ProductBacklog: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductDescription, setNewProductDescription] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: backlogItems = [], isLoading: itemsLoading } = useBacklogItems(selectedProductId || undefined);
  const createProduct = useCreateProduct();

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auto-select first product
  useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) return;

    const slug = newProductName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    try {
      const result = await createProduct.mutateAsync({
        name: newProductName,
        description: newProductDescription || undefined,
        slug,
      });
      
      setSelectedProductId(result.id);
      setNewProductName('');
      setNewProductDescription('');
      setIsCreateProductOpen(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto">
            <CardContent className="py-12 text-center">
              <ClipboardList className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Sign in Required</h2>
              <p className="text-muted-foreground mb-6">
                Please sign in to access the Product Backlog.
              </p>
              <Button onClick={() => navigate('/auth')}>
                Sign In
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Product Backlog | Altogether Agile</title>
        <meta name="description" content="Capture, prioritize, and manage your product backlog with our intuitive backlog management tool." />
      </Helmet>
      
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/ai-tools')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ClipboardList className="h-8 w-8 text-primary" />
              Product Backlog
            </h1>
            <p className="text-muted-foreground mt-1">
              Capture and prioritize your product enhancements
            </p>
          </div>
        </div>

        {/* Product Selector */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 flex-1">
                <Package className="h-5 w-5 text-muted-foreground" />
                <Label className="text-sm font-medium">Product:</Label>
                {productsLoading ? (
                  <div className="h-10 w-48 bg-muted animate-pulse rounded" />
                ) : products.length > 0 ? (
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-muted-foreground text-sm">No products yet</span>
                )}
              </div>
              
              <Dialog open={isCreateProductOpen} onOpenChange={setIsCreateProductOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Product
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Product</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateProduct} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Product Name</Label>
                      <Input
                        placeholder="e.g., Altogether Agile"
                        value={newProductName}
                        onChange={(e) => setNewProductName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description (optional)</Label>
                      <Textarea
                        placeholder="Brief description of the product"
                        value={newProductDescription}
                        onChange={(e) => setNewProductDescription(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button 
                        type="button" 
                        variant="ghost"
                        onClick={() => setIsCreateProductOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createProduct.isPending}>
                        Create Product
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            
            {selectedProduct?.description && (
              <p className="text-sm text-muted-foreground mt-2 ml-7">
                {selectedProduct.description}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Main Content */}
        {selectedProductId ? (
          <div className="space-y-6">
            <BacklogQuickAdd productId={selectedProductId} />
            <BacklogList items={backlogItems} isLoading={itemsLoading} />
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Create Your First Product</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating a product to track its backlog items.
              </p>
              <Button onClick={() => setIsCreateProductOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Product
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default ProductBacklog;
