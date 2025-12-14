import { useCallback } from 'react';

interface CanvasElement {
  id: string;
  type: 'bmc' | 'story' | 'sticky' | 'epic' | 'feature';
  content: any;
}

type ElementType = 'epic' | 'feature' | 'story';

/**
 * Hook for automatic hierarchical story numbering
 * Epic: X.0 (e.g., 1.0, 2.0)
 * Feature: X.Y (e.g., 1.1, 1.2)
 * Story: X.Y.Z (e.g., 1.1.1, 1.1.2)
 */
export function useStoryNumbering(elements: CanvasElement[]) {
  // Extract all existing story numbers by type
  const getExistingNumbers = useCallback(() => {
    const numbers = {
      epic: [] as string[],
      feature: [] as string[],
      story: [] as string[],
    };

    elements.forEach(el => {
      if (['epic', 'feature', 'story'].includes(el.type)) {
        const storyNumber = el.content?.storyNumber;
        if (storyNumber && typeof storyNumber === 'string' && storyNumber.trim()) {
          numbers[el.type as ElementType].push(storyNumber.trim());
        }
      }
    });

    return numbers;
  }, [elements]);

  // Get the next available number for a given type
  const getNextNumber = useCallback((type: ElementType): string => {
    const numbers = getExistingNumbers();
    
    if (type === 'epic') {
      // Epic format: X.0
      // Find highest X value
      let maxX = 0;
      numbers.epic.forEach(num => {
        const match = num.match(/^(\d+)\.0$/);
        if (match) {
          maxX = Math.max(maxX, parseInt(match[1], 10));
        }
      });
      return `${maxX + 1}.0`;
    }
    
    if (type === 'feature') {
      // Feature format: X.Y (where Y > 0)
      // Find highest epic number, then find next feature under it
      let maxEpic = 1;
      numbers.epic.forEach(num => {
        const match = num.match(/^(\d+)\.0$/);
        if (match) {
          maxEpic = Math.max(maxEpic, parseInt(match[1], 10));
        }
      });
      
      // Find highest Y for the latest epic
      let maxY = 0;
      numbers.feature.forEach(num => {
        const match = num.match(/^(\d+)\.(\d+)$/);
        if (match && parseInt(match[1], 10) === maxEpic && parseInt(match[2], 10) > 0) {
          maxY = Math.max(maxY, parseInt(match[2], 10));
        }
      });
      
      return `${maxEpic}.${maxY + 1}`;
    }
    
    if (type === 'story') {
      // Story format: X.Y.Z
      // Find highest feature number, then find next story under it
      let maxEpic = 1;
      let maxFeature = 1;
      
      numbers.feature.forEach(num => {
        const match = num.match(/^(\d+)\.(\d+)$/);
        if (match) {
          const epicNum = parseInt(match[1], 10);
          const featureNum = parseInt(match[2], 10);
          if (epicNum > maxEpic || (epicNum === maxEpic && featureNum > maxFeature)) {
            maxEpic = epicNum;
            maxFeature = featureNum;
          }
        }
      });
      
      // If no features exist, default to 1.1
      if (numbers.feature.length === 0) {
        maxFeature = 1;
      }
      
      // Find highest Z for the latest feature
      let maxZ = 0;
      numbers.story.forEach(num => {
        const match = num.match(/^(\d+)\.(\d+)\.(\d+)$/);
        if (match && parseInt(match[1], 10) === maxEpic && parseInt(match[2], 10) === maxFeature) {
          maxZ = Math.max(maxZ, parseInt(match[3], 10));
        }
      });
      
      return `${maxEpic}.${maxFeature}.${maxZ + 1}`;
    }
    
    return '1.0';
  }, [getExistingNumbers]);

  // Generate child numbers for split stories
  const getChildNumbers = useCallback((parentNumber: string, count: number): string[] => {
    if (!parentNumber || !parentNumber.trim()) {
      // If parent has no number, generate sequential story numbers
      const numbers = getExistingNumbers();
      let maxZ = 0;
      numbers.story.forEach(num => {
        const match = num.match(/^(\d+)\.(\d+)\.(\d+)$/);
        if (match) {
          maxZ = Math.max(maxZ, parseInt(match[3], 10));
        }
      });
      
      return Array.from({ length: count }, (_, i) => `1.1.${maxZ + i + 1}`);
    }
    
    const parts = parentNumber.split('.');
    const numbers = getExistingNumbers();
    
    if (parts.length === 3) {
      // Parent is a story (X.Y.Z) - children get X.Y.(Z+1), X.Y.(Z+2), etc.
      const x = parts[0];
      const y = parts[1];
      
      // Find highest Z in existing stories under same X.Y
      let maxZ = parseInt(parts[2], 10);
      numbers.story.forEach(num => {
        const match = num.match(/^(\d+)\.(\d+)\.(\d+)$/);
        if (match && match[1] === x && match[2] === y) {
          maxZ = Math.max(maxZ, parseInt(match[3], 10));
        }
      });
      
      return Array.from({ length: count }, (_, i) => `${x}.${y}.${maxZ + i + 1}`);
    }
    
    if (parts.length === 2) {
      // Parent is a feature (X.Y) - children get X.Y.1, X.Y.2, etc.
      const x = parts[0];
      const y = parts[1];
      
      // Find highest Z in existing stories under same X.Y
      let maxZ = 0;
      numbers.story.forEach(num => {
        const match = num.match(/^(\d+)\.(\d+)\.(\d+)$/);
        if (match && match[1] === x && match[2] === y) {
          maxZ = Math.max(maxZ, parseInt(match[3], 10));
        }
      });
      
      return Array.from({ length: count }, (_, i) => `${x}.${y}.${maxZ + i + 1}`);
    }
    
    // Fallback
    return Array.from({ length: count }, (_, i) => `1.1.${i + 1}`);
  }, [getExistingNumbers]);

  return {
    getNextNumber,
    getChildNumbers,
    getExistingNumbers,
  };
}
