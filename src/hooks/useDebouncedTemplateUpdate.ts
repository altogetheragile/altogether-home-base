import { useState, useCallback, useRef, useEffect } from 'react';
import { useDebounce } from './useDebounce';

export function useDebouncedTemplateUpdate<T>(
  initialValue: T,
  onUpdate: (value: T) => void,
  delay: number = 300
) {
  const [localValue, setLocalValue] = useState<T>(initialValue);
  const debouncedValue = useDebounce(localValue, delay);
  const hasInitialized = useRef(false);

  // Update local state when initial value changes (e.g., when switching sections)
  useEffect(() => {
    setLocalValue(initialValue);
  }, [initialValue]);

  // Trigger update when debounced value changes, but not on initial render
  useEffect(() => {
    if (hasInitialized.current && debouncedValue !== initialValue) {
      onUpdate(debouncedValue);
    } else {
      hasInitialized.current = true;
    }
  }, [debouncedValue, onUpdate, initialValue]);

  const updateValue = useCallback((value: T) => {
    setLocalValue(value);
  }, []);

  return { localValue, updateValue };
}