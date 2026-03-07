import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('useBlogPosts', () => {
  it('does not use !inner join on blog_post_tags', () => {
    const source = readFileSync(resolve(__dirname, '../hooks/useBlogPosts.ts'), 'utf-8');
    expect(source).not.toContain('blog_post_tags!inner');
  });
});
