import React, { createContext, useContext, useState } from 'react';

interface TechniqueFilterContextType {
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: (show: boolean) => void;
  compareMode: boolean;
  setCompareMode: (compare: boolean) => void;
  selectedForComparison: string[];
  addToComparison: (techniqueId: string) => void;
  removeFromComparison: (techniqueId: string) => void;
  clearComparison: () => void;
}

const TechniqueFilterContext = createContext<TechniqueFilterContextType | undefined>(undefined);

export const useTechniqueFilter = () => {
  const context = useContext(TechniqueFilterContext);
  if (!context) {
    throw new Error('useTechniqueFilter must be used within a TechniqueFilterProvider');
  }
  return context;
};

interface TechniqueFilterProviderProps {
  children: React.ReactNode;
}

export const TechniqueFilterProvider: React.FC<TechniqueFilterProviderProps> = ({ children }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);

  const addToComparison = (techniqueId: string) => {
    setSelectedForComparison(prev => 
      prev.includes(techniqueId) ? prev : [...prev, techniqueId].slice(0, 3) // Max 3 for comparison
    );
  };

  const removeFromComparison = (techniqueId: string) => {
    setSelectedForComparison(prev => prev.filter(id => id !== techniqueId));
  };

  const clearComparison = () => {
    setSelectedForComparison([]);
    setCompareMode(false);
  };

  return (
    <TechniqueFilterContext.Provider value={{
      viewMode,
      setViewMode,
      showAdvancedFilters,
      setShowAdvancedFilters,
      compareMode,
      setCompareMode,
      selectedForComparison,
      addToComparison,
      removeFromComparison,
      clearComparison,
    }}>
      {children}
    </TechniqueFilterContext.Provider>
  );
};