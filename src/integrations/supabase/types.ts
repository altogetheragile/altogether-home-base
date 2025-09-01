export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      activity_domains: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      admin_logs: {
        Row: {
          action: string
          created_at: string
          created_by: string | null
          details: Json | null
          id: string
        }
        Insert: {
          action: string
          created_at?: string
          created_by?: string | null
          details?: Json | null
          id?: string
        }
        Update: {
          action?: string
          created_at?: string
          created_by?: string | null
          details?: Json | null
          id?: string
        }
        Relationships: []
      }
      auth_logs: {
        Row: {
          created_at: string | null
          event_message: string | null
          id: string
          metadata: Json | null
          timestamp: string
        }
        Insert: {
          created_at?: string | null
          event_message?: string | null
          id?: string
          metadata?: Json | null
          timestamp?: string
        }
        Update: {
          created_at?: string | null
          event_message?: string | null
          id?: string
          metadata?: Json | null
          timestamp?: string
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      blog_post_tags: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "blog_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string | null
          category_id: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          estimated_reading_time: number | null
          excerpt: string | null
          featured_image_url: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          like_count: number | null
          published_at: string | null
          seo_description: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          slug: string
          title: string
          updated_at: string | null
          updated_by: string | null
          view_count: number | null
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          estimated_reading_time?: number | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          like_count?: number | null
          published_at?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          slug: string
          title: string
          updated_at?: string | null
          updated_by?: string | null
          view_count?: number | null
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          estimated_reading_time?: number | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          like_count?: number | null
          published_at?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          slug?: string
          title?: string
          updated_at?: string | null
          updated_by?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      canvases: {
        Row: {
          created_at: string
          created_by: string | null
          data: Json
          id: string
          project_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data?: Json
          id?: string
          project_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data?: Json
          id?: string
          project_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "canvases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_votes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
          vote_type: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          message: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          message?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          message?: string | null
        }
        Relationships: []
      }
      content_blocks: {
        Row: {
          content: Json
          created_at: string
          id: string
          is_visible: boolean | null
          page_id: string
          position: number
          type: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          is_visible?: boolean | null
          page_id: string
          position?: number
          type: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          is_visible?: boolean | null
          page_id?: string
          position?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_blocks_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      data_imports: {
        Row: {
          created_at: string
          created_by: string | null
          failed_rows: number | null
          file_size: number | null
          file_type: string
          filename: string
          id: string
          mapping_config: Json | null
          original_filename: string | null
          processed_at: string | null
          processing_log: Json | null
          status: string
          successful_rows: number | null
          target_entity: string
          total_rows: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          failed_rows?: number | null
          file_size?: number | null
          file_type: string
          filename: string
          id?: string
          mapping_config?: Json | null
          original_filename?: string | null
          processed_at?: string | null
          processing_log?: Json | null
          status?: string
          successful_rows?: number | null
          target_entity: string
          total_rows?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          failed_rows?: number | null
          file_size?: number | null
          file_type?: string
          filename?: string
          id?: string
          mapping_config?: Json | null
          original_filename?: string | null
          processed_at?: string | null
          processing_log?: Json | null
          status?: string
          successful_rows?: number | null
          target_entity?: string
          total_rows?: number | null
        }
        Relationships: []
      }
      epics: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          jira_issue_key: string | null
          position: number | null
          project_id: string | null
          status: string | null
          theme: string | null
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          jira_issue_key?: string | null
          position?: number | null
          project_id?: string | null
          status?: string | null
          theme?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          jira_issue_key?: string | null
          position?: number | null
          project_id?: string | null
          status?: string | null
          theme?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "epics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      event_categories: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          event_id: string | null
          id: string
          payment_status: string | null
          registered_at: string | null
          stripe_session_id: string | null
          user_id: string | null
        }
        Insert: {
          event_id?: string | null
          id?: string
          payment_status?: string | null
          registered_at?: string | null
          stripe_session_id?: string | null
          user_id?: string | null
        }
        Update: {
          event_id?: string | null
          id?: string
          payment_status?: string | null
          registered_at?: string | null
          stripe_session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_templates: {
        Row: {
          banner_template: string | null
          brand_color: string | null
          category_id: string | null
          created_at: string | null
          created_by: string | null
          default_instructor_id: string | null
          default_location_id: string | null
          description: string | null
          difficulty_rating: string | null
          duration_days: number | null
          event_type_id: string | null
          format_id: string | null
          hero_image_url: string | null
          icon_name: string | null
          id: string
          key_benefits: string[] | null
          learning_outcomes: string[] | null
          level_id: string | null
          popularity_score: number | null
          prerequisites: string[] | null
          target_audience: string | null
          template_tags: string[] | null
          title: string
          updated_by: string | null
        }
        Insert: {
          banner_template?: string | null
          brand_color?: string | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          default_instructor_id?: string | null
          default_location_id?: string | null
          description?: string | null
          difficulty_rating?: string | null
          duration_days?: number | null
          event_type_id?: string | null
          format_id?: string | null
          hero_image_url?: string | null
          icon_name?: string | null
          id?: string
          key_benefits?: string[] | null
          learning_outcomes?: string[] | null
          level_id?: string | null
          popularity_score?: number | null
          prerequisites?: string[] | null
          target_audience?: string | null
          template_tags?: string[] | null
          title: string
          updated_by?: string | null
        }
        Update: {
          banner_template?: string | null
          brand_color?: string | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          default_instructor_id?: string | null
          default_location_id?: string | null
          description?: string | null
          difficulty_rating?: string | null
          duration_days?: number | null
          event_type_id?: string | null
          format_id?: string | null
          hero_image_url?: string | null
          icon_name?: string | null
          id?: string
          key_benefits?: string[] | null
          learning_outcomes?: string[] | null
          level_id?: string | null
          popularity_score?: number | null
          prerequisites?: string[] | null
          target_audience?: string | null
          template_tags?: string[] | null
          title?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "event_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_templates_default_instructor_id_fkey"
            columns: ["default_instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_templates_default_location_id_fkey"
            columns: ["default_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_templates_event_type_id_fkey"
            columns: ["event_type_id"]
            isOneToOne: false
            referencedRelation: "event_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_templates_format_id_fkey"
            columns: ["format_id"]
            isOneToOne: false
            referencedRelation: "formats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_templates_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
        ]
      }
      event_types: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          banner_image_url: string | null
          capacity: number | null
          category_id: string | null
          course_code: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          daily_schedule: string | null
          description: string | null
          end_date: string | null
          event_type_id: string | null
          expected_revenue_cents: number | null
          format_id: string | null
          id: string
          instructor_id: string | null
          internal_notes: string | null
          is_published: boolean | null
          lead_source: string | null
          level_id: string | null
          location_id: string | null
          meeting_link: string | null
          price_cents: number | null
          registration_deadline: string | null
          seo_slug: string | null
          start_date: string
          status: string | null
          tags: string[] | null
          template_id: string | null
          time_zone: string | null
          title: string
          updated_by: string | null
          venue_details: string | null
        }
        Insert: {
          banner_image_url?: string | null
          capacity?: number | null
          category_id?: string | null
          course_code?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          daily_schedule?: string | null
          description?: string | null
          end_date?: string | null
          event_type_id?: string | null
          expected_revenue_cents?: number | null
          format_id?: string | null
          id?: string
          instructor_id?: string | null
          internal_notes?: string | null
          is_published?: boolean | null
          lead_source?: string | null
          level_id?: string | null
          location_id?: string | null
          meeting_link?: string | null
          price_cents?: number | null
          registration_deadline?: string | null
          seo_slug?: string | null
          start_date: string
          status?: string | null
          tags?: string[] | null
          template_id?: string | null
          time_zone?: string | null
          title: string
          updated_by?: string | null
          venue_details?: string | null
        }
        Update: {
          banner_image_url?: string | null
          capacity?: number | null
          category_id?: string | null
          course_code?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          daily_schedule?: string | null
          description?: string | null
          end_date?: string | null
          event_type_id?: string | null
          expected_revenue_cents?: number | null
          format_id?: string | null
          id?: string
          instructor_id?: string | null
          internal_notes?: string | null
          is_published?: boolean | null
          lead_source?: string | null
          level_id?: string | null
          location_id?: string | null
          meeting_link?: string | null
          price_cents?: number | null
          registration_deadline?: string | null
          seo_slug?: string | null
          start_date?: string
          status?: string | null
          tags?: string[] | null
          template_id?: string | null
          time_zone?: string | null
          title?: string
          updated_by?: string | null
          venue_details?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "event_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_events_category_id"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "event_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_events_event_type_id"
            columns: ["event_type_id"]
            isOneToOne: false
            referencedRelation: "event_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_events_format_id"
            columns: ["format_id"]
            isOneToOne: false
            referencedRelation: "formats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_events_level_id"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
        ]
      }
      features: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          epic_id: string | null
          id: string
          jira_issue_key: string | null
          position: number | null
          project_id: string | null
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          epic_id?: string | null
          id?: string
          jira_issue_key?: string | null
          position?: number | null
          project_id?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          epic_id?: string | null
          id?: string
          jira_issue_key?: string | null
          position?: number | null
          project_id?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "features_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_features_epic"
            columns: ["epic_id"]
            isOneToOne: false
            referencedRelation: "epics"
            referencedColumns: ["id"]
          },
        ]
      }
      formats: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      instructors: {
        Row: {
          bio: string | null
          created_by: string | null
          id: string
          name: string
          profile_image_url: string | null
          updated_by: string | null
        }
        Insert: {
          bio?: string | null
          created_by?: string | null
          id?: string
          name: string
          profile_image_url?: string | null
          updated_by?: string | null
        }
        Update: {
          bio?: string | null
          created_by?: string | null
          id?: string
          name?: string
          profile_image_url?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      knowledge_categories: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      knowledge_items: {
        Row: {
          background: string | null
          category_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          domain_id: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          name: string
          planning_layer_id: string | null
          slug: string
          source: string | null
          updated_at: string
          updated_by: string | null
          view_count: number | null
        }
        Insert: {
          background?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          domain_id?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          name: string
          planning_layer_id?: string | null
          slug: string
          source?: string | null
          updated_at?: string
          updated_by?: string | null
          view_count?: number | null
        }
        Update: {
          background?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          domain_id?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          name?: string
          planning_layer_id?: string | null
          slug?: string
          source?: string | null
          updated_at?: string
          updated_by?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "knowledge_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_items_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "activity_domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_items_planning_layer_id_fkey"
            columns: ["planning_layer_id"]
            isOneToOne: false
            referencedRelation: "planning_layers"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_use_cases: {
        Row: {
          case_type: string
          created_at: string
          created_by: string | null
          how: string | null
          how_much: string | null
          id: string
          knowledge_item_id: string
          summary: string | null
          title: string | null
          updated_at: string
          updated_by: string | null
          what: string | null
          when_used: string | null
          where_used: string | null
          who: string | null
          why: string | null
        }
        Insert: {
          case_type: string
          created_at?: string
          created_by?: string | null
          how?: string | null
          how_much?: string | null
          id?: string
          knowledge_item_id: string
          summary?: string | null
          title?: string | null
          updated_at?: string
          updated_by?: string | null
          what?: string | null
          when_used?: string | null
          where_used?: string | null
          who?: string | null
          why?: string | null
        }
        Update: {
          case_type?: string
          created_at?: string
          created_by?: string | null
          how?: string | null
          how_much?: string | null
          id?: string
          knowledge_item_id?: string
          summary?: string | null
          title?: string | null
          updated_at?: string
          updated_by?: string | null
          what?: string | null
          when_used?: string | null
          where_used?: string | null
          who?: string | null
          why?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_use_cases_knowledge_item_id_fkey"
            columns: ["knowledge_item_id"]
            isOneToOne: false
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
        ]
      }
      levels: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          address: string | null
          created_by: string | null
          id: string
          name: string
          updated_by: string | null
          virtual_url: string | null
        }
        Insert: {
          address?: string | null
          created_by?: string | null
          id?: string
          name: string
          updated_by?: string | null
          virtual_url?: string | null
        }
        Update: {
          address?: string | null
          created_by?: string | null
          id?: string
          name?: string
          updated_by?: string | null
          virtual_url?: string | null
        }
        Relationships: []
      }
      pages: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_published: boolean | null
          slug: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          slug: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          slug?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      planning_layers: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number | null
          id: string
          name: string
          slug: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          name: string
          slug: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      postgres_logs: {
        Row: {
          created_at: string | null
          error_severity: string | null
          event_message: string | null
          id: string
          identifier: string | null
          metadata: Json | null
          timestamp: string
        }
        Insert: {
          created_at?: string | null
          error_severity?: string | null
          event_message?: string | null
          id?: string
          identifier?: string | null
          metadata?: Json | null
          timestamp?: string
        }
        Update: {
          created_at?: string | null
          error_severity?: string | null
          event_message?: string | null
          id?: string
          identifier?: string | null
          metadata?: Json | null
          timestamp?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          role: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          role?: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          color_theme: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_archived: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          color_theme?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_archived?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          color_theme?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_archived?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      search_analytics: {
        Row: {
          clicked_technique_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          query: string
          results_count: number
          search_filters: Json | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          clicked_technique_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          query: string
          results_count?: number
          search_filters?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          clicked_technique_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          query?: string
          results_count?: number
          search_filters?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      staging_data: {
        Row: {
          created_at: string
          id: string
          import_id: string
          mapped_data: Json | null
          processed_at: string | null
          processing_errors: Json | null
          processing_status: string
          raw_data: Json
          row_number: number
          target_record_id: string | null
          validation_errors: Json | null
          validation_status: string
        }
        Insert: {
          created_at?: string
          id?: string
          import_id: string
          mapped_data?: Json | null
          processed_at?: string | null
          processing_errors?: Json | null
          processing_status?: string
          raw_data?: Json
          row_number: number
          target_record_id?: string | null
          validation_errors?: Json | null
          validation_status?: string
        }
        Update: {
          created_at?: string
          id?: string
          import_id?: string
          mapped_data?: Json | null
          processed_at?: string | null
          processing_errors?: Json | null
          processing_status?: string
          raw_data?: Json
          row_number?: number
          target_record_id?: string | null
          validation_errors?: Json | null
          validation_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "staging_data_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "data_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      story_relationships: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          relationship_type: string
          source_story_id: string
          target_story_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          relationship_type: string
          source_story_id: string
          target_story_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          relationship_type?: string
          source_story_id?: string
          target_story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_story_relationships_source"
            columns: ["source_story_id"]
            isOneToOne: false
            referencedRelation: "user_stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_story_relationships_target"
            columns: ["target_story_id"]
            isOneToOne: false
            referencedRelation: "user_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bookmarks: {
        Row: {
          created_at: string
          id: string
          technique_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          technique_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          technique_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_contributed_examples: {
        Row: {
          company_size: string | null
          context: string | null
          created_at: string
          description: string
          id: string
          industry: string | null
          outcome: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          submitted_by: string
          technique_id: string
          title: string
          updated_at: string
        }
        Insert: {
          company_size?: string | null
          context?: string | null
          created_at?: string
          description: string
          id?: string
          industry?: string | null
          outcome?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_by: string
          technique_id: string
          title: string
          updated_at?: string
        }
        Update: {
          company_size?: string | null
          context?: string | null
          created_at?: string
          description?: string
          id?: string
          industry?: string | null
          outcome?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_by?: string
          technique_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_learning_path_progress: {
        Row: {
          completed_at: string | null
          completion_percentage: number | null
          created_at: string
          current_step_id: string | null
          id: string
          path_id: string
          started_at: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string
          current_step_id?: string | null
          id?: string
          path_id: string
          started_at?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string
          current_step_id?: string | null
          id?: string
          path_id?: string
          started_at?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          display_preferences: Json | null
          id: string
          notification_settings: Json | null
          preferred_categories: string[] | null
          preferred_difficulty_levels: string[] | null
          preferred_tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_preferences?: Json | null
          id?: string
          notification_settings?: Json | null
          preferred_categories?: string[] | null
          preferred_difficulty_levels?: string[] | null
          preferred_tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_preferences?: Json | null
          id?: string
          notification_settings?: Json | null
          preferred_categories?: string[] | null
          preferred_difficulty_levels?: string[] | null
          preferred_tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_reading_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          started_at: string | null
          status: string
          technique_id: string
          time_spent_seconds: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          started_at?: string | null
          status?: string
          technique_id: string
          time_spent_seconds?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          started_at?: string | null
          status?: string
          technique_id?: string
          time_spent_seconds?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_stories: {
        Row: {
          acceptance_criteria: string[] | null
          created_at: string
          created_by: string | null
          description: string | null
          epic_id: string | null
          feature_id: string | null
          id: string
          issue_type: string | null
          jira_issue_key: string | null
          position: number | null
          priority: string | null
          project_id: string | null
          status: string | null
          story_points: number | null
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          acceptance_criteria?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          epic_id?: string | null
          feature_id?: string | null
          id?: string
          issue_type?: string | null
          jira_issue_key?: string | null
          position?: number | null
          priority?: string | null
          project_id?: string | null
          status?: string | null
          story_points?: number | null
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          acceptance_criteria?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          epic_id?: string | null
          feature_id?: string | null
          id?: string
          issue_type?: string | null
          jira_issue_key?: string | null
          position?: number | null
          priority?: string | null
          project_id?: string | null
          status?: string | null
          story_points?: number | null
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_stories_epic"
            columns: ["epic_id"]
            isOneToOne: false
            referencedRelation: "epics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_stories_feature"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_stories_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_knowledge_slug: {
        Args: { input_text: string }
        Returns: string
      }
      get_popular_searches: {
        Args: { p_days?: number; p_limit?: number }
        Returns: {
          query: string
          search_count: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_blog_view_count: {
        Args: { post_id: string }
        Returns: undefined
      }
      increment_knowledge_item_view_count: {
        Args: { item_id: string }
        Returns: undefined
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
