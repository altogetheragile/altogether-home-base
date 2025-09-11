export type ContentBlockType =
  | 'text'
  | 'image'
  | 'video'
  | 'hero'
  | 'section'
  | 'events'; // ✅ allow events

export interface Page {
  id: string;
  slug: string;
  title: string;
  description?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface ContentBlock {
  id: string;
  page_id: string;
  type: ContentBlockType;
  content: Record<string, any>;
  position: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface PageWithBlocks extends Page {
  content_blocks: ContentBlock[];
}

export interface ContentBlockCreate {
  page_id: string;
  type: ContentBlockType;
  content: Record<string, any>;
  position: number;
  is_visible?: boolean;
}

export interface ContentBlockUpdate {
  id: string;
  type?: ContentBlockType;
  content?: Record<string, any>;
  position?: number;
  is_visible?: boolean;
}
