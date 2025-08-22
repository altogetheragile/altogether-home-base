import { useCallback, useRef } from 'react';
import { CanvasData } from '@/components/canvas/BaseCanvas';

export const useDebounceCanvas = (
  callback: (data: CanvasData) => void,
  delay: number = 300
) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedCallback = useCallback((data: CanvasData) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(data);
    }, delay);
  }, [callback, delay]);

  const flushCallback = useCallback((data: CanvasData) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    callback(data);
  }, [callback]);

  return { debouncedCallback, flushCallback };
};