import { useState, useCallback } from 'react';
import type { TemplateSection } from '@/types/template';

export const useMultiSelection = () => {
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([]);

  const selectSection = useCallback((section: TemplateSection, isCtrlPressed: boolean = false) => {
    if (isCtrlPressed) {
      setSelectedSectionIds(prev => 
        prev.includes(section.id)
          ? prev.filter(id => id !== section.id)
          : [...prev, section.id]
      );
    } else {
      setSelectedSectionIds([section.id]);
    }
  }, []);

  const selectMultipleSections = useCallback((sectionIds: string[]) => {
    setSelectedSectionIds(sectionIds);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSectionIds([]);
  }, []);

  const isSelected = useCallback((sectionId: string) => {
    return selectedSectionIds.includes(sectionId);
  }, [selectedSectionIds]);

  const getSelectedSections = useCallback((allSections: TemplateSection[]) => {
    return allSections.filter(section => selectedSectionIds.includes(section.id));
  }, [selectedSectionIds]);

  const toggleSelection = useCallback((sectionId: string) => {
    setSelectedSectionIds(prev => 
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  }, []);

  return {
    selectedSectionIds,
    selectSection,
    selectMultipleSections,
    clearSelection,
    isSelected,
    getSelectedSections,
    toggleSelection,
    selectedCount: selectedSectionIds.length,
  };
};