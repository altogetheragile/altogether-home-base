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
    PostgrestVersion: "14.4"
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
      activity_focus: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          target_id: string | null
          target_table: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_id?: string | null
          target_table: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_id?: string | null
          target_table?: string
        }
        Relationships: []
      }
      ai_generation_audit: {
        Row: {
          created_at: string
          error_message: string | null
          execution_time_ms: number | null
          id: string
          input_data: Json | null
          ip_address: string | null
          output_data: Json | null
          story_level: string | null
          success: boolean | null
          token_count: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          input_data?: Json | null
          ip_address?: string | null
          output_data?: Json | null
          story_level?: string | null
          success?: boolean | null
          token_count?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          input_data?: Json | null
          ip_address?: string | null
          output_data?: Json | null
          story_level?: string | null
          success?: boolean | null
          token_count?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      authors: {
        Row: {
          bio: string | null
          created_at: string
          created_by: string | null
          email: string | null
          expertise_areas: string[] | null
          id: string
          name: string
          profile_image_url: string | null
          updated_at: string
          updated_by: string | null
          website_url: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          expertise_areas?: string[] | null
          id?: string
          name: string
          profile_image_url?: string | null
          updated_at?: string
          updated_by?: string | null
          website_url?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          expertise_areas?: string[] | null
          id?: string
          name?: string
          profile_image_url?: string | null
          updated_at?: string
          updated_by?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      backlog_items: {
        Row: {
          acceptance_criteria: string[] | null
          backlog_position: number | null
          created_at: string
          created_by: string | null
          description: string | null
          estimated_effort: number | null
          estimated_value: number | null
          id: string
          item_type: string | null
          parent_item_id: string | null
          priority: string | null
          product_id: string | null
          project_id: string | null
          source: string | null
          status: string | null
          tags: string[] | null
          target_release: string | null
          title: string
          updated_at: string
          user_story_id: string | null
        }
        Insert: {
          acceptance_criteria?: string[] | null
          backlog_position?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_effort?: number | null
          estimated_value?: number | null
          id?: string
          item_type?: string | null
          parent_item_id?: string | null
          priority?: string | null
          product_id?: string | null
          project_id?: string | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          target_release?: string | null
          title: string
          updated_at?: string
          user_story_id?: string | null
        }
        Update: {
          acceptance_criteria?: string[] | null
          backlog_position?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_effort?: number | null
          estimated_value?: number | null
          id?: string
          item_type?: string | null
          parent_item_id?: string | null
          priority?: string | null
          product_id?: string | null
          project_id?: string | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          target_release?: string | null
          title?: string
          updated_at?: string
          user_story_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "backlog_items_parent_item_id_fkey"
            columns: ["parent_item_id"]
            isOneToOne: false
            referencedRelation: "backlog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backlog_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backlog_items_user_story_id_fkey"
            columns: ["user_story_id"]
            isOneToOne: false
            referencedRelation: "user_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_post_tags: {
        Row: {
          blog_post_id: string
          id: string
          tag_id: string
        }
        Insert: {
          blog_post_id: string
          id?: string
          tag_id: string
        }
        Update: {
          blog_post_id?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_tags_blog_post_id_fkey"
            columns: ["blog_post_id"]
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
          created_at: string
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
          updated_at: string
          updated_by: string | null
          view_count: number | null
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          content?: string | null
          created_at?: string
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
          updated_at?: string
          updated_by?: string | null
          view_count?: number | null
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          content?: string | null
          created_at?: string
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
          updated_at?: string
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
          created_at: string
          id: string
          name: string
          slug: string
          usage_count: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          usage_count?: number | null
        }
        Update: {
          created_at?: string
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
          data: Json | null
          id: string
          project_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data?: Json | null
          id?: string
          project_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data?: Json | null
          id?: string
          project_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "canvases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_reports: {
        Row: {
          comment_id: string
          created_at: string
          details: string | null
          id: string
          reason: string
          reported_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          comment_id: string
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reported_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          comment_id?: string
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reported_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comment_reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "knowledge_item_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          attachment_filename: string | null
          attachment_size: number | null
          attachment_type: string | null
          attachment_url: string | null
          created_at: string
          email: string
          enquiry_type: string | null
          full_name: string
          id: string
          ip_address: string | null
          message: string
          phone: string | null
          preferred_contact_method: string | null
          status: string | null
          subject: string | null
        }
        Insert: {
          attachment_filename?: string | null
          attachment_size?: number | null
          attachment_type?: string | null
          attachment_url?: string | null
          created_at?: string
          email: string
          enquiry_type?: string | null
          full_name: string
          id?: string
          ip_address?: string | null
          message: string
          phone?: string | null
          preferred_contact_method?: string | null
          status?: string | null
          subject?: string | null
        }
        Update: {
          attachment_filename?: string | null
          attachment_size?: number | null
          attachment_type?: string | null
          attachment_url?: string | null
          created_at?: string
          email?: string
          enquiry_type?: string | null
          full_name?: string
          id?: string
          ip_address?: string | null
          message?: string
          phone?: string | null
          preferred_contact_method?: string | null
          status?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      content_blocks: {
        Row: {
          content: Json | null
          created_at: string
          id: string
          is_visible: boolean | null
          page_id: string
          position: number | null
          type: string
          updated_at: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          id?: string
          is_visible?: boolean | null
          page_id: string
          position?: number | null
          type?: string
          updated_at?: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          id?: string
          is_visible?: boolean | null
          page_id?: string
          position?: number | null
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
      course_feedback: {
        Row: {
          comment: string
          company: string | null
          course_name: string
          created_at: string
          created_by: string | null
          event_id: string | null
          first_name: string
          id: string
          is_approved: boolean | null
          is_featured: boolean | null
          job_title: string | null
          last_name: string
          rating: number | null
          source: string | null
          source_url: string | null
          submitted_at: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          comment: string
          company?: string | null
          course_name: string
          created_at?: string
          created_by?: string | null
          event_id?: string | null
          first_name: string
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          job_title?: string | null
          last_name: string
          rating?: number | null
          source?: string | null
          source_url?: string | null
          submitted_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          comment?: string
          company?: string | null
          course_name?: string
          created_at?: string
          created_by?: string | null
          event_id?: string | null
          first_name?: string
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          job_title?: string | null
          last_name?: string
          rating?: number | null
          source?: string | null
          source_url?: string | null
          submitted_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_feedback_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
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
          status: string | null
          successful_rows: number | null
          target_entity: string
          total_rows: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          failed_rows?: number | null
          file_size?: number | null
          file_type?: string
          filename: string
          id?: string
          mapping_config?: Json | null
          original_filename?: string | null
          processed_at?: string | null
          processing_log?: Json | null
          status?: string | null
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
          status?: string | null
          successful_rows?: number | null
          target_entity?: string
          total_rows?: number | null
        }
        Relationships: []
      }
      decision_levels: {
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
      epics: {
        Row: {
          business_objective: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          jira_issue_key: string | null
          position: number | null
          project_id: string | null
          stakeholders: string[] | null
          start_date: string | null
          status: string | null
          success_metrics: string[] | null
          target_date: string | null
          theme: string | null
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          business_objective?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          jira_issue_key?: string | null
          position?: number | null
          project_id?: string | null
          stakeholders?: string[] | null
          start_date?: string | null
          status?: string | null
          success_metrics?: string[] | null
          target_date?: string | null
          theme?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          business_objective?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          jira_issue_key?: string | null
          position?: number | null
          project_id?: string | null
          stakeholders?: string[] | null
          start_date?: string | null
          status?: string | null
          success_metrics?: string[] | null
          target_date?: string | null
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
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          created_at: string
          event_id: string
          id: string
          payment_status: string | null
          registered_at: string
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          payment_status?: string | null
          registered_at?: string
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          payment_status?: string | null
          registered_at?: string
          stripe_session_id?: string | null
          user_id?: string
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
          created_at: string
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
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          banner_template?: string | null
          brand_color?: string | null
          category_id?: string | null
          created_at?: string
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
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          banner_template?: string | null
          brand_color?: string | null
          category_id?: string | null
          created_at?: string
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
          updated_at?: string
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
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          banner_image_url: string | null
          capacity: number | null
          category_id: string | null
          course_code: string | null
          created_at: string
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
          updated_at: string
          updated_by: string | null
          venue_details: string | null
        }
        Insert: {
          banner_image_url?: string | null
          capacity?: number | null
          category_id?: string | null
          course_code?: string | null
          created_at?: string
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
          updated_at?: string
          updated_by?: string | null
          venue_details?: string | null
        }
        Update: {
          banner_image_url?: string | null
          capacity?: number | null
          category_id?: string | null
          course_code?: string | null
          created_at?: string
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
          updated_at?: string
          updated_by?: string | null
          venue_details?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "event_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_event_type_id_fkey"
            columns: ["event_type_id"]
            isOneToOne: false
            referencedRelation: "event_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_format_id_fkey"
            columns: ["format_id"]
            isOneToOne: false
            referencedRelation: "formats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
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
        ]
      }
      features: {
        Row: {
          acceptance_criteria: string[] | null
          created_at: string
          created_by: string | null
          description: string | null
          epic_id: string | null
          id: string
          jira_issue_key: string | null
          position: number | null
          project_id: string | null
          status: string | null
          title: string
          updated_at: string
          updated_by: string | null
          user_value: string | null
        }
        Insert: {
          acceptance_criteria?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          epic_id?: string | null
          id?: string
          jira_issue_key?: string | null
          position?: number | null
          project_id?: string | null
          status?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
          user_value?: string | null
        }
        Update: {
          acceptance_criteria?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          epic_id?: string | null
          id?: string
          jira_issue_key?: string | null
          position?: number | null
          project_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          user_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "features_epic_id_fkey"
            columns: ["epic_id"]
            isOneToOne: false
            referencedRelation: "epics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "features_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      formats: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      instructors: {
        Row: {
          bio: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          profile_image_url: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          profile_image_url?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          profile_image_url?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      kb_feedback: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number | null
          technique_id: string
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number | null
          technique_id: string
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number | null
          technique_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kb_feedback_technique_id_fkey"
            columns: ["technique_id"]
            isOneToOne: false
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
        ]
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
      knowledge_item_categories: {
        Row: {
          category_id: string
          id: string
          is_primary: boolean | null
          knowledge_item_id: string
          rationale: string | null
        }
        Insert: {
          category_id: string
          id?: string
          is_primary?: boolean | null
          knowledge_item_id: string
          rationale?: string | null
        }
        Update: {
          category_id?: string
          id?: string
          is_primary?: boolean | null
          knowledge_item_id?: string
          rationale?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_item_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "knowledge_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_item_categories_knowledge_item_id_fkey"
            columns: ["knowledge_item_id"]
            isOneToOne: false
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_item_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          knowledge_item_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          knowledge_item_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          knowledge_item_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_item_comments_knowledge_item_id_fkey"
            columns: ["knowledge_item_id"]
            isOneToOne: false
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_item_decision_levels: {
        Row: {
          decision_level_id: string
          id: string
          is_primary: boolean | null
          knowledge_item_id: string
          rationale: string | null
        }
        Insert: {
          decision_level_id: string
          id?: string
          is_primary?: boolean | null
          knowledge_item_id: string
          rationale?: string | null
        }
        Update: {
          decision_level_id?: string
          id?: string
          is_primary?: boolean | null
          knowledge_item_id?: string
          rationale?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_item_decision_levels_decision_level_id_fkey"
            columns: ["decision_level_id"]
            isOneToOne: false
            referencedRelation: "decision_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_item_decision_levels_knowledge_item_id_fkey"
            columns: ["knowledge_item_id"]
            isOneToOne: false
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_item_domains: {
        Row: {
          domain_id: string
          id: string
          is_primary: boolean | null
          knowledge_item_id: string
          rationale: string | null
        }
        Insert: {
          domain_id: string
          id?: string
          is_primary?: boolean | null
          knowledge_item_id: string
          rationale?: string | null
        }
        Update: {
          domain_id?: string
          id?: string
          is_primary?: boolean | null
          knowledge_item_id?: string
          rationale?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_item_domains_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "activity_domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_item_domains_knowledge_item_id_fkey"
            columns: ["knowledge_item_id"]
            isOneToOne: false
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_item_likes: {
        Row: {
          created_at: string
          id: string
          knowledge_item_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          knowledge_item_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          knowledge_item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_item_likes_knowledge_item_id_fkey"
            columns: ["knowledge_item_id"]
            isOneToOne: false
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_item_references: {
        Row: {
          created_at: string
          excerpt: string | null
          id: string
          knowledge_item_id: string
          page_reference: string | null
          publication_id: string
          reference_type: string | null
        }
        Insert: {
          created_at?: string
          excerpt?: string | null
          id?: string
          knowledge_item_id: string
          page_reference?: string | null
          publication_id: string
          reference_type?: string | null
        }
        Update: {
          created_at?: string
          excerpt?: string | null
          id?: string
          knowledge_item_id?: string
          page_reference?: string | null
          publication_id?: string
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_item_references_knowledge_item_id_fkey"
            columns: ["knowledge_item_id"]
            isOneToOne: false
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_item_references_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "publications"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_item_relationships: {
        Row: {
          created_at: string
          id: string
          knowledge_item_id: string
          position: number | null
          related_item_id: string
          relationship_type: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          knowledge_item_id: string
          position?: number | null
          related_item_id: string
          relationship_type?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          knowledge_item_id?: string
          position?: number | null
          related_item_id?: string
          relationship_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_item_relationships_knowledge_item_id_fkey"
            columns: ["knowledge_item_id"]
            isOneToOne: false
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_item_relationships_related_item_id_fkey"
            columns: ["related_item_id"]
            isOneToOne: false
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_item_steps: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          knowledge_item_id: string
          position: number | null
          step_number: number
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          knowledge_item_id: string
          position?: number | null
          step_number?: number
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          knowledge_item_id?: string
          position?: number | null
          step_number?: number
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_item_steps_knowledge_item_id_fkey"
            columns: ["knowledge_item_id"]
            isOneToOne: false
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_item_tags: {
        Row: {
          id: string
          knowledge_item_id: string
          tag_id: string
        }
        Insert: {
          id?: string
          knowledge_item_id: string
          tag_id: string
        }
        Update: {
          id?: string
          knowledge_item_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_item_tags_knowledge_item_id_fkey"
            columns: ["knowledge_item_id"]
            isOneToOne: false
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_item_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "knowledge_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_item_templates: {
        Row: {
          created_at: string
          custom_config: Json | null
          display_order: number | null
          id: string
          knowledge_item_id: string
          template_id: string
        }
        Insert: {
          created_at?: string
          custom_config?: Json | null
          display_order?: number | null
          id?: string
          knowledge_item_id: string
          template_id: string
        }
        Update: {
          created_at?: string
          custom_config?: Json | null
          display_order?: number | null
          id?: string
          knowledge_item_id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_item_templates_knowledge_item_id_fkey"
            columns: ["knowledge_item_id"]
            isOneToOne: false
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_item_templates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "knowledge_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_items: {
        Row: {
          author: string | null
          avoid_when: string[] | null
          background: string | null
          category_id: string | null
          common_pitfalls: string[] | null
          created_at: string
          created_by: string | null
          decision_boundaries: string | null
          decisions_supported: string[] | null
          description: string | null
          domain_id: string | null
          emoji: string | null
          evidence_sources: string[] | null
          governance_value: string | null
          has_ai_support: boolean | null
          hero_image_url: string | null
          icon: string | null
          id: string
          inspect_adapt_signals: string[] | null
          is_featured: boolean | null
          is_published: boolean | null
          item_type: string | null
          key_terminology: Json | null
          learning_value_summary: string | null
          maturity_indicators: string[] | null
          name: string
          planning_focus_id: string | null
          popularity_score: number | null
          primary_publication_id: string | null
          publication_year: number | null
          reference_url: string | null
          related_techniques: string[] | null
          slug: string
          source: string | null
          typical_output: string | null
          updated_at: string
          updated_by: string | null
          use_this_when: string[] | null
          view_count: number | null
          what_good_looks_like: string[] | null
          why_it_exists: string | null
        }
        Insert: {
          author?: string | null
          avoid_when?: string[] | null
          background?: string | null
          category_id?: string | null
          common_pitfalls?: string[] | null
          created_at?: string
          created_by?: string | null
          decision_boundaries?: string | null
          decisions_supported?: string[] | null
          description?: string | null
          domain_id?: string | null
          emoji?: string | null
          evidence_sources?: string[] | null
          governance_value?: string | null
          has_ai_support?: boolean | null
          hero_image_url?: string | null
          icon?: string | null
          id?: string
          inspect_adapt_signals?: string[] | null
          is_featured?: boolean | null
          is_published?: boolean | null
          item_type?: string | null
          key_terminology?: Json | null
          learning_value_summary?: string | null
          maturity_indicators?: string[] | null
          name: string
          planning_focus_id?: string | null
          popularity_score?: number | null
          primary_publication_id?: string | null
          publication_year?: number | null
          reference_url?: string | null
          related_techniques?: string[] | null
          slug: string
          source?: string | null
          typical_output?: string | null
          updated_at?: string
          updated_by?: string | null
          use_this_when?: string[] | null
          view_count?: number | null
          what_good_looks_like?: string[] | null
          why_it_exists?: string | null
        }
        Update: {
          author?: string | null
          avoid_when?: string[] | null
          background?: string | null
          category_id?: string | null
          common_pitfalls?: string[] | null
          created_at?: string
          created_by?: string | null
          decision_boundaries?: string | null
          decisions_supported?: string[] | null
          description?: string | null
          domain_id?: string | null
          emoji?: string | null
          evidence_sources?: string[] | null
          governance_value?: string | null
          has_ai_support?: boolean | null
          hero_image_url?: string | null
          icon?: string | null
          id?: string
          inspect_adapt_signals?: string[] | null
          is_featured?: boolean | null
          is_published?: boolean | null
          item_type?: string | null
          key_terminology?: Json | null
          learning_value_summary?: string | null
          maturity_indicators?: string[] | null
          name?: string
          planning_focus_id?: string | null
          popularity_score?: number | null
          primary_publication_id?: string | null
          publication_year?: number | null
          reference_url?: string | null
          related_techniques?: string[] | null
          slug?: string
          source?: string | null
          typical_output?: string | null
          updated_at?: string
          updated_by?: string | null
          use_this_when?: string[] | null
          view_count?: number | null
          what_good_looks_like?: string[] | null
          why_it_exists?: string | null
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
            foreignKeyName: "knowledge_items_planning_focus_id_fkey"
            columns: ["planning_focus_id"]
            isOneToOne: false
            referencedRelation: "planning_focuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_items_primary_publication_id_fkey"
            columns: ["primary_publication_id"]
            isOneToOne: false
            referencedRelation: "publications"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_items_media: {
        Row: {
          created_at: string
          id: string
          knowledge_item_id: string
          media_asset_id: string
          position: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          knowledge_item_id: string
          media_asset_id: string
          position?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          knowledge_item_id?: string
          media_asset_id?: string
          position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_items_media_knowledge_item_id_fkey"
            columns: ["knowledge_item_id"]
            isOneToOne: false
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_items_media_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          usage_count: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          usage_count?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      knowledge_templates: {
        Row: {
          category: string | null
          config: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          file_filename: string | null
          file_format: string | null
          file_page_count: number | null
          file_size: number | null
          file_url: string | null
          id: string
          is_public: boolean | null
          is_published: boolean | null
          pdf_file_size: number | null
          pdf_filename: string | null
          pdf_page_count: number | null
          pdf_url: string | null
          short_description: string | null
          tags: string[] | null
          template_type: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          updated_by: string | null
          usage_count: number | null
          version: string | null
        }
        Insert: {
          category?: string | null
          config?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_filename?: string | null
          file_format?: string | null
          file_page_count?: number | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_public?: boolean | null
          is_published?: boolean | null
          pdf_file_size?: number | null
          pdf_filename?: string | null
          pdf_page_count?: number | null
          pdf_url?: string | null
          short_description?: string | null
          tags?: string[] | null
          template_type?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
          usage_count?: number | null
          version?: string | null
        }
        Update: {
          category?: string | null
          config?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_filename?: string | null
          file_format?: string | null
          file_page_count?: number | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_public?: boolean | null
          is_published?: boolean | null
          pdf_file_size?: number | null
          pdf_filename?: string | null
          pdf_page_count?: number | null
          pdf_url?: string | null
          short_description?: string | null
          tags?: string[] | null
          template_type?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          usage_count?: number | null
          version?: string | null
        }
        Relationships: []
      }
      knowledge_use_cases: {
        Row: {
          case_type: string
          created_at: string
          how: string | null
          how_much: string | null
          id: string
          knowledge_item_id: string
          summary: string | null
          title: string | null
          updated_at: string
          what: string | null
          when_used: string | null
          where_used: string | null
          who: string | null
          why: string | null
        }
        Insert: {
          case_type?: string
          created_at?: string
          how?: string | null
          how_much?: string | null
          id?: string
          knowledge_item_id: string
          summary?: string | null
          title?: string | null
          updated_at?: string
          what?: string | null
          when_used?: string | null
          where_used?: string | null
          who?: string | null
          why?: string | null
        }
        Update: {
          case_type?: string
          created_at?: string
          how?: string | null
          how_much?: string | null
          id?: string
          knowledge_item_id?: string
          summary?: string | null
          title?: string | null
          updated_at?: string
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
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          address: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          updated_at: string
          updated_by: string | null
          virtual_url: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          updated_at?: string
          updated_by?: string | null
          virtual_url?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          updated_at?: string
          updated_by?: string | null
          virtual_url?: string | null
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          alt_text: string | null
          caption: string | null
          created_at: string
          created_by: string | null
          file_size: number | null
          file_url: string
          filename: string
          folder: string | null
          height: number | null
          id: string
          is_template: boolean | null
          mime_type: string | null
          original_filename: string | null
          tags: string[] | null
          thumbnail_url: string | null
          updated_at: string
          updated_by: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          created_by?: string | null
          file_size?: number | null
          file_url: string
          filename: string
          folder?: string | null
          height?: number | null
          id?: string
          is_template?: boolean | null
          mime_type?: string | null
          original_filename?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string
          updated_by?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          created_by?: string | null
          file_size?: number | null
          file_url?: string
          filename?: string
          folder?: string | null
          height?: number | null
          id?: string
          is_template?: boolean | null
          mime_type?: string | null
          original_filename?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string
          updated_by?: string | null
          width?: number | null
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
          show_in_main_menu: boolean | null
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
          show_in_main_menu?: boolean | null
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
          show_in_main_menu?: boolean | null
          slug?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      planning_focuses: {
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      project_artifacts: {
        Row: {
          artifact_type: string
          created_at: string
          created_by: string | null
          data: Json | null
          description: string | null
          display_order: number | null
          id: string
          name: string
          project_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          artifact_type: string
          created_at?: string
          created_by?: string | null
          data?: Json | null
          description?: string | null
          display_order?: number | null
          id?: string
          name: string
          project_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          artifact_type?: string
          created_at?: string
          created_by?: string | null
          data?: Json | null
          description?: string | null
          display_order?: number | null
          id?: string
          name?: string
          project_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_artifacts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
      publication_authors: {
        Row: {
          author_id: string
          author_order: number | null
          id: string
          publication_id: string
          role: string | null
        }
        Insert: {
          author_id: string
          author_order?: number | null
          id?: string
          publication_id: string
          role?: string | null
        }
        Update: {
          author_id?: string
          author_order?: number | null
          id?: string
          publication_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "publication_authors_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publication_authors_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "publications"
            referencedColumns: ["id"]
          },
        ]
      }
      publications: {
        Row: {
          abstract: string | null
          created_at: string
          created_by: string | null
          doi: string | null
          id: string
          isbn: string | null
          issue: string | null
          journal: string | null
          keywords: string[] | null
          pages: string | null
          publication_type: string
          publication_year: number | null
          publisher: string | null
          title: string
          updated_at: string
          updated_by: string | null
          url: string | null
          volume: string | null
        }
        Insert: {
          abstract?: string | null
          created_at?: string
          created_by?: string | null
          doi?: string | null
          id?: string
          isbn?: string | null
          issue?: string | null
          journal?: string | null
          keywords?: string[] | null
          pages?: string | null
          publication_type?: string
          publication_year?: number | null
          publisher?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
          url?: string | null
          volume?: string | null
        }
        Update: {
          abstract?: string | null
          created_at?: string
          created_by?: string | null
          doi?: string | null
          id?: string
          isbn?: string | null
          issue?: string | null
          journal?: string | null
          keywords?: string[] | null
          pages?: string | null
          publication_type?: string
          publication_year?: number | null
          publisher?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          url?: string | null
          volume?: string | null
        }
        Relationships: []
      }
      search_analytics: {
        Row: {
          clicked_technique_id: string | null
          created_at: string
          id: string
          query: string
          results_count: number | null
          search_filters: Json | null
          user_id: string | null
        }
        Insert: {
          clicked_technique_id?: string | null
          created_at?: string
          id?: string
          query: string
          results_count?: number | null
          search_filters?: Json | null
          user_id?: string | null
        }
        Update: {
          clicked_technique_id?: string | null
          created_at?: string
          id?: string
          query?: string
          results_count?: number | null
          search_filters?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "search_analytics_clicked_technique_id_fkey"
            columns: ["clicked_technique_id"]
            isOneToOne: false
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          company_description: string | null
          company_name: string | null
          contact_email: string | null
          contact_location: string | null
          contact_phone: string | null
          copyright_text: string | null
          created_at: string
          id: string
          quick_links: Json | null
          show_ai_tools: boolean | null
          show_blog: boolean | null
          show_events: boolean | null
          show_knowledge: boolean | null
          social_facebook: string | null
          social_github: string | null
          social_linkedin: string | null
          social_twitter: string | null
          social_youtube: string | null
          updated_at: string
        }
        Insert: {
          company_description?: string | null
          company_name?: string | null
          contact_email?: string | null
          contact_location?: string | null
          contact_phone?: string | null
          copyright_text?: string | null
          created_at?: string
          id?: string
          quick_links?: Json | null
          show_ai_tools?: boolean | null
          show_blog?: boolean | null
          show_events?: boolean | null
          show_knowledge?: boolean | null
          social_facebook?: string | null
          social_github?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          social_youtube?: string | null
          updated_at?: string
        }
        Update: {
          company_description?: string | null
          company_name?: string | null
          contact_email?: string | null
          contact_location?: string | null
          contact_phone?: string | null
          copyright_text?: string | null
          created_at?: string
          id?: string
          quick_links?: Json | null
          show_ai_tools?: boolean | null
          show_blog?: boolean | null
          show_events?: boolean | null
          show_knowledge?: boolean | null
          social_facebook?: string | null
          social_github?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          social_youtube?: string | null
          updated_at?: string
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
          processing_status: string | null
          raw_data: Json | null
          row_number: number
          target_record_id: string | null
          validation_errors: Json | null
          validation_status: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          import_id: string
          mapped_data?: Json | null
          processed_at?: string | null
          processing_errors?: Json | null
          processing_status?: string | null
          raw_data?: Json | null
          row_number: number
          target_record_id?: string | null
          validation_errors?: Json | null
          validation_status?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          import_id?: string
          mapped_data?: Json | null
          processed_at?: string | null
          processing_errors?: Json | null
          processing_status?: string | null
          raw_data?: Json | null
          row_number?: number
          target_record_id?: string | null
          validation_errors?: Json | null
          validation_status?: string | null
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
      template_usages: {
        Row: {
          created_at: string
          exported_format: string | null
          id: string
          session_data: Json | null
          template_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          exported_format?: string | null
          id?: string
          session_data?: Json | null
          template_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          exported_format?: string | null
          id?: string
          session_data?: Json | null
          template_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "template_usages_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "knowledge_templates"
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
        Relationships: [
          {
            foreignKeyName: "user_bookmarks_technique_id_fkey"
            columns: ["technique_id"]
            isOneToOne: false
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reading_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          started_at: string | null
          status: string | null
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
          status?: string | null
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
          status?: string | null
          technique_id?: string
          time_spent_seconds?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reading_progress_technique_id_fkey"
            columns: ["technique_id"]
            isOneToOne: false
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_stories: {
        Row: {
          acceptance_criteria: string[] | null
          assumptions_risks: string | null
          business_value: string | null
          confidence_level: number | null
          created_at: string
          created_by: string | null
          customer_journey_stage: string | null
          definition_of_done: Json | null
          definition_of_ready: Json | null
          dependencies: string[] | null
          description: string | null
          design_notes: string | null
          epic_id: string | null
          evidence_links: string[] | null
          feature_id: string | null
          id: string
          impact_effort_matrix: Json | null
          issue_type: string | null
          jira_issue_key: string | null
          non_functional_requirements: string[] | null
          parent_story_id: string | null
          position: number | null
          priority: string | null
          problem_statement: string | null
          project_id: string | null
          sprint: string | null
          status: string | null
          story_points: number | null
          story_type: string | null
          tags: string[] | null
          technical_notes: string | null
          title: string
          ui_mockup_url: string | null
          updated_at: string
          updated_by: string | null
          user_persona: string | null
        }
        Insert: {
          acceptance_criteria?: string[] | null
          assumptions_risks?: string | null
          business_value?: string | null
          confidence_level?: number | null
          created_at?: string
          created_by?: string | null
          customer_journey_stage?: string | null
          definition_of_done?: Json | null
          definition_of_ready?: Json | null
          dependencies?: string[] | null
          description?: string | null
          design_notes?: string | null
          epic_id?: string | null
          evidence_links?: string[] | null
          feature_id?: string | null
          id?: string
          impact_effort_matrix?: Json | null
          issue_type?: string | null
          jira_issue_key?: string | null
          non_functional_requirements?: string[] | null
          parent_story_id?: string | null
          position?: number | null
          priority?: string | null
          problem_statement?: string | null
          project_id?: string | null
          sprint?: string | null
          status?: string | null
          story_points?: number | null
          story_type?: string | null
          tags?: string[] | null
          technical_notes?: string | null
          title: string
          ui_mockup_url?: string | null
          updated_at?: string
          updated_by?: string | null
          user_persona?: string | null
        }
        Update: {
          acceptance_criteria?: string[] | null
          assumptions_risks?: string | null
          business_value?: string | null
          confidence_level?: number | null
          created_at?: string
          created_by?: string | null
          customer_journey_stage?: string | null
          definition_of_done?: Json | null
          definition_of_ready?: Json | null
          dependencies?: string[] | null
          description?: string | null
          design_notes?: string | null
          epic_id?: string | null
          evidence_links?: string[] | null
          feature_id?: string | null
          id?: string
          impact_effort_matrix?: Json | null
          issue_type?: string | null
          jira_issue_key?: string | null
          non_functional_requirements?: string[] | null
          parent_story_id?: string | null
          position?: number | null
          priority?: string | null
          problem_statement?: string | null
          project_id?: string | null
          sprint?: string | null
          status?: string | null
          story_points?: number | null
          story_type?: string | null
          tags?: string[] | null
          technical_notes?: string | null
          title?: string
          ui_mockup_url?: string | null
          updated_at?: string
          updated_by?: string | null
          user_persona?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_stories_epic_id_fkey"
            columns: ["epic_id"]
            isOneToOne: false
            referencedRelation: "epics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_stories_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_stories_parent_story_id_fkey"
            columns: ["parent_story_id"]
            isOneToOne: false
            referencedRelation: "user_stories"
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
      get_feedback_stats: {
        Args: { p_technique_id: string }
        Returns: {
          average_rating: number
          total_ratings: number
        }[]
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
      increment_knowledge_item_view_count: {
        Args: { item_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
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
