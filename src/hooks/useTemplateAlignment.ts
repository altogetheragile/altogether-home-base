import { useCallback } from 'react';
import type { TemplateSection } from '@/types/template';

export const useTemplateAlignment = () => {
  const snapToGrid = useCallback((value: number, gridSize: number): number => {
    return Math.round(value / gridSize) * gridSize;
  }, []);

  const alignHorizontal = useCallback((
    sections: TemplateSection[],
    alignment: 'left' | 'center' | 'right'
  ): Partial<TemplateSection>[] => {
    if (sections.length === 0) return [];

    const referenceX = (() => {
      switch (alignment) {
        case 'left':
          return Math.min(...sections.map(s => s.x));
        case 'right': {
          const rightMost = Math.max(...sections.map(s => s.x + s.width));
          return rightMost;
        }
        case 'center': {
          const leftMost = Math.min(...sections.map(s => s.x));
          const rightMost = Math.max(...sections.map(s => s.x + s.width));
          return (leftMost + rightMost) / 2;
        }
      }
    })();

    return sections.map(section => {
      let newX: number;
      switch (alignment) {
        case 'left':
          newX = referenceX;
          break;
        case 'right':
          newX = referenceX - section.width;
          break;
        case 'center':
          newX = referenceX - section.width / 2;
          break;
      }
      return { x: Math.max(0, newX) };
    });
  }, []);

  const alignVertical = useCallback((
    sections: TemplateSection[],
    alignment: 'top' | 'middle' | 'bottom'
  ): Partial<TemplateSection>[] => {
    if (sections.length === 0) return [];

    const referenceY = (() => {
      switch (alignment) {
        case 'top':
          return Math.min(...sections.map(s => s.y));
        case 'bottom': {
          const bottomMost = Math.max(...sections.map(s => s.y + s.height));
          return bottomMost;
        }
        case 'middle': {
          const topMost = Math.min(...sections.map(s => s.y));
          const bottomMost = Math.max(...sections.map(s => s.y + s.height));
          return (topMost + bottomMost) / 2;
        }
      }
    })();

    return sections.map(section => {
      let newY: number;
      switch (alignment) {
        case 'top':
          newY = referenceY;
          break;
        case 'bottom':
          newY = referenceY - section.height;
          break;
        case 'middle':
          newY = referenceY - section.height / 2;
          break;
      }
      return { y: Math.max(0, newY) };
    });
  }, []);

  const distribute = useCallback((
    sections: TemplateSection[],
    direction: 'horizontal' | 'vertical'
  ): Partial<TemplateSection>[] => {
    if (sections.length < 3) return [];

    const sorted = [...sections].sort((a, b) => {
      return direction === 'horizontal' ? a.x - b.x : a.y - b.y;
    });

    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    
    const totalSpan = direction === 'horizontal' 
      ? (last.x + last.width) - first.x
      : (last.y + last.height) - first.y;

    const totalItemSize = sorted.reduce((sum, section) => {
      return sum + (direction === 'horizontal' ? section.width : section.height);
    }, 0);

    const availableSpace = totalSpan - totalItemSize;
    const spacing = availableSpace / (sorted.length - 1);

    return sections.map(section => {
      const index = sorted.findIndex(s => s.id === section.id);
      if (index === 0 || index === sorted.length - 1) {
        return {}; // Don't move first and last items
      }

      let position = first[direction === 'horizontal' ? 'x' : 'y'];
      for (let i = 1; i <= index; i++) {
        position += sorted[i - 1][direction === 'horizontal' ? 'width' : 'height'] + spacing;
      }

      return direction === 'horizontal' 
        ? { x: Math.max(0, position) }
        : { y: Math.max(0, position) };
    });
  }, []);

  const alignToCanvas = useCallback((
    sections: TemplateSection[],
    canvasDimensions: { width: number; height: number },
    alignment: 'center' | 'left' | 'right' | 'top' | 'bottom'
  ): Partial<TemplateSection>[] => {
    if (sections.length === 0) return [];

    return sections.map(section => {
      let updates: Partial<TemplateSection> = {};

      switch (alignment) {
        case 'center':
          updates.x = (canvasDimensions.width - section.width) / 2;
          updates.y = (canvasDimensions.height - section.height) / 2;
          break;
        case 'left':
          updates.x = 0;
          break;
        case 'right':
          updates.x = canvasDimensions.width - section.width;
          break;
        case 'top':
          updates.y = 0;
          break;
        case 'bottom':
          updates.y = canvasDimensions.height - section.height;
          break;
      }

      // Ensure positions are within bounds
      updates.x = Math.max(0, Math.min(updates.x ?? section.x, canvasDimensions.width - section.width));
      updates.y = Math.max(0, Math.min(updates.y ?? section.y, canvasDimensions.height - section.height));

      return updates;
    });
  }, []);

  return {
    snapToGrid,
    alignHorizontal,
    alignVertical,
    distribute,
    alignToCanvas,
  };
};