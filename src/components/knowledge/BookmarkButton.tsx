import React from 'react';
import { Button } from '@/components/ui/button';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useUserBookmarks } from '@/hooks/useUserBookmarks';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface BookmarkButtonProps {
  techniqueId: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

export const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  techniqueId,
  variant = 'ghost',
  size = 'sm',
  showLabel = false,
}) => {
  const { user } = useAuth();
  const { isBookmarked, toggleBookmark, isToggling } = useUserBookmarks();

  if (!user) return null;

  const bookmarked = isBookmarked(techniqueId);

  const handleToggle = () => {
    toggleBookmark(techniqueId);
    toast.success(
      bookmarked ? 'Removed from bookmarks' : 'Added to bookmarks'
    );
  };

  return (
    <Button
      onClick={handleToggle}
      disabled={isToggling}
      variant={variant}
      size={size}
      className="transition-colors"
    >
      {bookmarked ? (
        <BookmarkCheck className="h-4 w-4 text-amber-500" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
      {showLabel && (
        <span className="ml-2">
          {bookmarked ? 'Bookmarked' : 'Bookmark'}
        </span>
      )}
    </Button>
  );
};