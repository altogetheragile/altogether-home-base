import { useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useDebouncedTemplateUpdate } from '@/hooks/useDebouncedTemplateUpdate';

interface DebouncedTemplateInputProps {
  id: string;
  value: string;
  onUpdate: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function DebouncedTemplateInput({
  id,
  value,
  onUpdate,
  placeholder,
  className,
  autoFocus = false
}: DebouncedTemplateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { localValue, updateValue } = useDebouncedTemplateUpdate(
    value,
    onUpdate,
    300
  );

  // Handle focus restoration and auto-focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Restore focus if component remounts during typing
  useEffect(() => {
    const shouldRestoreFocus = document.activeElement?.id === id;
    if (shouldRestoreFocus && inputRef.current) {
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
  };

  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation();
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.stopPropagation();
  };

  return (
    <Input
      ref={inputRef}
      id={id}
      value={localValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      onFocus={handleFocus}
      placeholder={placeholder}
      className={className}
    />
  );
}