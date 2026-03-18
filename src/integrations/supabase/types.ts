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
