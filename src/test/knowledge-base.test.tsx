import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import KnowledgeBase from '@/pages/KnowledgeBase';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } })
    }
  }
}));

// Mock hooks
vi.mock('@/hooks/useKnowledgeTechniques', () => ({
  useKnowledgeTechniques: vi.fn(() => ({
    data: [
      {
        id: '1',
        name: 'Test Technique',
        slug: 'test-technique',
        summary: 'A test technique for testing',
        difficulty_level: 'Beginner',
        estimated_reading_time: 5,
        is_featured: true,
        category: { name: 'Test Category', color: '#3B82F6' },
        tags: [{ name: 'testing', slug: 'testing' }]
      }
    ],
    isLoading: false,
    error: null
  }))
}));

vi.mock('@/hooks/useKnowledgeCategories', () => ({
  useKnowledgeCategories: vi.fn(() => ({
    data: [
      { id: '1', name: 'Test Category', slug: 'test-category', color: '#3B82F6' }
    ],
    isLoading: false
  }))
}));

vi.mock('@/hooks/useKnowledgeTags', () => ({
  useKnowledgeTags: vi.fn(() => ({
    data: [
      { id: '1', name: 'testing', slug: 'testing' }
    ],
    isLoading: false
  }))
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isLoading: false,
    userRole: null
  })
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('KnowledgeBase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders knowledge base page', async () => {
    render(<KnowledgeBase />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Knowledge Base')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search techniques/i)).toBeInTheDocument();
  });

  it('displays techniques', async () => {
    render(<KnowledgeBase />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText('Test Technique')).toBeInTheDocument();
    });
    
    expect(screen.getByText('A test technique for testing')).toBeInTheDocument();
    expect(screen.getByText('Beginner')).toBeInTheDocument();
    expect(screen.getByText('5 min read')).toBeInTheDocument();
  });

  it('handles search input', async () => {
    const user = userEvent.setup();
    render(<KnowledgeBase />, { wrapper: createWrapper() });
    
    const searchInput = screen.getByPlaceholderText(/search techniques/i);
    await user.type(searchInput, 'test query');
    
    expect(searchInput).toHaveValue('test query');
  });

  it('filters by category', async () => {
    const user = userEvent.setup();
    render(<KnowledgeBase />, { wrapper: createWrapper() });
    
    const categoryFilter = screen.getByText('All Categories');
    await user.click(categoryFilter);
    
    expect(screen.getByText('Test Category')).toBeInTheDocument();
  });
});