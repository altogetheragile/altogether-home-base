import { useState, useEffect, useRef, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  delay?: number;
}

export function useAutoSave<T>({ data, onSave, delay = 1500 }: UseAutoSaveOptions<T>) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const lastSavedRef = useRef<string>('');
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const debouncedData = useDebounce(data, delay);

  useEffect(() => {
    const serialized = JSON.stringify(debouncedData);
    if (lastSavedRef.current === '') {
      lastSavedRef.current = serialized;
      return;
    }
    if (serialized === lastSavedRef.current) return;

    let cancelled = false;
    setIsSaving(true);
    onSaveRef.current(debouncedData)
      .then(() => {
        if (!cancelled) {
          lastSavedRef.current = serialized;
          setLastSaved(new Date());
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsSaving(false);
      });

    return () => { cancelled = true; };
  }, [debouncedData]);

  const saveNow = useCallback(() => {
    const serialized = JSON.stringify(data);
    if (serialized === lastSavedRef.current) return;

    setIsSaving(true);
    onSaveRef.current(data)
      .then(() => {
        lastSavedRef.current = serialized;
        setLastSaved(new Date());
      })
      .catch(() => {})
      .finally(() => setIsSaving(false));
  }, [data]);

  return { isSaving, lastSaved, saveNow };
}
