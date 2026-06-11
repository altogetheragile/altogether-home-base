import { useEffect, useRef } from 'react';

/**
 * A textarea that grows to fit its content so nothing is clipped on screen.
 * Coached editors used fixed-height, resize-none textareas, which hid any text
 * past the visible rows. Use this wherever a coached value can run long.
 */
export function AutoTextarea({ value, onChange, className, placeholder, rows = 2 }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
  placeholder?: string;
  rows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const grow = () => {
    const el = ref.current;
    if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; }
  };
  useEffect(grow, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      placeholder={placeholder}
      onChange={(e) => { onChange(e); grow(); }}
      rows={rows}
      className={className}
    />
  );
}
