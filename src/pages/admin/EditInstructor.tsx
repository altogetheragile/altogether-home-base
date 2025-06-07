
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

interface InstructorFormData {
  name: string;
  bio: string;
  profile_image_url: string;
}

const EditInstructor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<InstructorFormData>({
    name: '',
    bio: '',
    profile_image_url: '',
  });

  const { data: instructor, isLoading } = useQuery({
    queryKey: ['instructor', id],
    queryFn: async () => {
      if (!id) throw new Error('No instructor ID provided');
      
      const { data, error } = await supabase
        .from('instructors')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (instructor) {
      setFormData({
        name: instructor.name || '',
        bio: instructor.bio || '',
        profile_image_url: instructor.profile_image_url || '',
      });
    }
  }, [instructor]);

  const updateInstructorMutation = useMutation({
    mutationFn: async (data: InstructorFormData) => {
      if (!id) throw new Error('No instructor ID provided');
      
      const { error } = await supabase
        .from('instructors')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-instructors'] });
      toast({
        title: 'Success',
        description: 'Instructor updated successfully',
      });
      navigate('/admin/instructors');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update instructor',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Instructor name is required',
        variant: 'destructive',
      });
      return;
    }
    updateInstructorMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof InstructorFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!instructor) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Instructor not found</p>
        <Button onClick={() => navigate('/admin/instructors')} className="mt-4">
          Back to Instructors
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin/instructors')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Instructors
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Instructor</h1>
          <p className="text-gray-600">Update instructor information</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Instructor Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter instructor name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Enter instructor bio and background"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile_image_url">Profile Image URL</Label>
              <Input
                id="profile_image_url"
                type="url"
                value={formData.profile_image_url}
                onChange={(e) => handleInputChange('profile_image_url', e.target.value)}
                placeholder="https://example.com/instructor-photo.jpg"
              />
              {formData.profile_image_url && (
                <div className="mt-2">
                  <img
                    src={formData.profile_image_url}
                    alt="Preview"
                    className="w-20 h-20 rounded-full object-cover border"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/instructors')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateInstructorMutation.isPending}
              >
                {updateInstructorMutation.isPending ? 'Updating...' : 'Update Instructor'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditInstructor;
