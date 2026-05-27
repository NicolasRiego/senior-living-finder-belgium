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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activities_catalog: {
        Row: {
          category: string | null
          code: string
          created_at: string
          created_by_residence: string | null
          icon: string | null
          id: string
          is_custom: boolean
          label_fr: string
          label_nl: string | null
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string
          created_by_residence?: string | null
          icon?: string | null
          id?: string
          is_custom?: boolean
          label_fr: string
          label_nl?: string | null
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string
          created_by_residence?: string | null
          icon?: string | null
          id?: string
          is_custom?: boolean
          label_fr?: string
          label_nl?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_catalog_created_by_residence_fkey"
            columns: ["created_by_residence"]
            isOneToOne: false
            referencedRelation: "residence_search_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_catalog_created_by_residence_fkey"
            columns: ["created_by_residence"]
            isOneToOne: false
            referencedRelation: "residence_stats_30d"
            referencedColumns: ["residence_id"]
          },
          {
            foreignKeyName: "activities_catalog_created_by_residence_fkey"
            columns: ["created_by_residence"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_catalog_created_by_residence_fkey"
            columns: ["created_by_residence"]
            isOneToOne: false
            referencedRelation: "v_residence_price_summary"
            referencedColumns: ["residence_id"]
          },
        ]
      }
      admin_notes: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note: string
          residence_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note: string
          residence_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string
          residence_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notes_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residence_search_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_notes_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residence_stats_30d"
            referencedColumns: ["residence_id"]
          },
          {
            foreignKeyName: "admin_notes_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_notes_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "v_residence_price_summary"
            referencedColumns: ["residence_id"]
          },
        ]
      }
      apartments: {
        Row: {
          address_complement: string | null
          agency_fee: number | null
          available_from: string | null
          balcony_m2: number | null
          bathrooms: number | null
          bedrooms: number | null
          build_year: number | null
          building_floors: number | null
          building_state: string | null
          cave: boolean
          charges_monthly: number | null
          co_ownership_fee: number | null
          co2_emission: string | null
          created_at: string
          description_fr: string | null
          description_nl: string | null
          double_glazing: boolean | null
          elevator: boolean
          energy_class: string | null
          floor: number | null
          flooring: string | null
          furnished: boolean
          garden: boolean
          garden_m2: number | null
          has_alarm: boolean | null
          has_balcony: boolean | null
          has_digicode: boolean | null
          has_dressing: boolean | null
          has_interphone: boolean | null
          has_laundry: boolean | null
          has_lift: boolean | null
          has_office: boolean | null
          has_storage: boolean | null
          has_videophone: boolean | null
          heating_type: string | null
          hot_water: string | null
          id: string
          internet: string | null
          is_demo: boolean
          kitchen_equipped: boolean
          kitchen_type: string | null
          living_room_m2: number | null
          orientation: string | null
          parking: boolean
          parking_count: number | null
          parking_type: string | null
          primary_energy: number | null
          property_tax: number | null
          rent_price: number | null
          residence_id: string
          sale_price: number | null
          status: string
          storage_m2: number | null
          surface_m2: number | null
          terrace: boolean
          terrace_m2: number | null
          title_fr: string | null
          title_nl: string | null
          toilets: number | null
          transaction_type: string | null
          type: string | null
          updated_at: string
          wheelchair_accessible: boolean
        }
        Insert: {
          address_complement?: string | null
          agency_fee?: number | null
          available_from?: string | null
          balcony_m2?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          build_year?: number | null
          building_floors?: number | null
          building_state?: string | null
          cave?: boolean
          charges_monthly?: number | null
          co_ownership_fee?: number | null
          co2_emission?: string | null
          created_at?: string
          description_fr?: string | null
          description_nl?: string | null
          double_glazing?: boolean | null
          elevator?: boolean
          energy_class?: string | null
          floor?: number | null
          flooring?: string | null
          furnished?: boolean
          garden?: boolean
          garden_m2?: number | null
          has_alarm?: boolean | null
          has_balcony?: boolean | null
          has_digicode?: boolean | null
          has_dressing?: boolean | null
          has_interphone?: boolean | null
          has_laundry?: boolean | null
          has_lift?: boolean | null
          has_office?: boolean | null
          has_storage?: boolean | null
          has_videophone?: boolean | null
          heating_type?: string | null
          hot_water?: string | null
          id?: string
          internet?: string | null
          is_demo?: boolean
          kitchen_equipped?: boolean
          kitchen_type?: string | null
          living_room_m2?: number | null
          orientation?: string | null
          parking?: boolean
          parking_count?: number | null
          parking_type?: string | null
          primary_energy?: number | null
          property_tax?: number | null
          rent_price?: number | null
          residence_id: string
          sale_price?: number | null
          status?: string
          storage_m2?: number | null
          surface_m2?: number | null
          terrace?: boolean
          terrace_m2?: number | null
          title_fr?: string | null
          title_nl?: string | null
          toilets?: number | null
          transaction_type?: string | null
          type?: string | null
          updated_at?: string
          wheelchair_accessible?: boolean
        }
        Update: {
          address_complement?: string | null
          agency_fee?: number | null
          available_from?: string | null
          balcony_m2?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          build_year?: number | null
          building_floors?: number | null
          building_state?: string | null
          cave?: boolean
          charges_monthly?: number | null
          co_ownership_fee?: number | null
          co2_emission?: string | null
          created_at?: string
          description_fr?: string | null
          description_nl?: string | null
          double_glazing?: boolean | null
          elevator?: boolean
          energy_class?: string | null
          floor?: number | null
          flooring?: string | null
          furnished?: boolean
          garden?: boolean
          garden_m2?: number | null
          has_alarm?: boolean | null
          has_balcony?: boolean | null
          has_digicode?: boolean | null
          has_dressing?: boolean | null
          has_interphone?: boolean | null
          has_laundry?: boolean | null
          has_lift?: boolean | null
          has_office?: boolean | null
          has_storage?: boolean | null
          has_videophone?: boolean | null
          heating_type?: string | null
          hot_water?: string | null
          id?: string
          internet?: string | null
          is_demo?: boolean
          kitchen_equipped?: boolean
          kitchen_type?: string | null
          living_room_m2?: number | null
          orientation?: string | null
          parking?: boolean
          parking_count?: number | null
          parking_type?: string | null
          primary_energy?: number | null
          property_tax?: number | null
          rent_price?: number | null
          residence_id?: string
          sale_price?: number | null
          status?: string
          storage_m2?: number | null
          surface_m2?: number | null
          terrace?: boolean
          terrace_m2?: number | null
          title_fr?: string | null
          title_nl?: string | null
          toilets?: number | null
          transaction_type?: string | null
          type?: string | null
          updated_at?: string
          wheelchair_accessible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "apartments_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residence_search_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apartments_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residence_stats_30d"
            referencedColumns: ["residence_id"]
          },
          {
            foreignKeyName: "apartments_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apartments_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "v_residence_price_summary"
            referencedColumns: ["residence_id"]
          },
        ]
      }
      app_versions: {
        Row: {
          commit_sha: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          released_at: string
          version: string
        }
        Insert: {
          commit_sha?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          released_at?: string
          version: string
        }
        Update: {
          commit_sha?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          released_at?: string
          version?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          metadata_json: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          metadata_json?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          metadata_json?: Json
        }
        Relationships: []
      }
      be_postal_codes: {
        Row: {
          code_postal: string
          commune_fr: string
          commune_nl: string
          province: string
          region: string
          ville_fr: string
        }
        Insert: {
          code_postal: string
          commune_fr: string
          commune_nl: string
          province: string
          region: string
          ville_fr: string
        }
        Update: {
          code_postal?: string
          commune_fr?: string
          commune_nl?: string
          province?: string
          region?: string
          ville_fr?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          residence_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          residence_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          residence_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residence_search_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residence_stats_30d"
            referencedColumns: ["residence_id"]
          },
          {
            foreignKeyName: "favorites_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "v_residence_price_summary"
            referencedColumns: ["residence_id"]
          },
        ]
      }
      leads: {
        Row: {
          anonymized_at: string | null
          autonomy_level: string | null
          budget_max: number | null
          budget_min: number | null
          budget_range: string | null
          consent_rgpd: boolean
          contact_email: string
          contact_name: string
          contact_phone: string | null
          created_at: string
          for_whom: string | null
          id: string
          is_demo: boolean
          message: string | null
          region_target: string | null
          residence_id: string
          score: number
          status: Database["public"]["Enums"]["lead_status"]
          timing: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          anonymized_at?: string | null
          autonomy_level?: string | null
          budget_max?: number | null
          budget_min?: number | null
          budget_range?: string | null
          consent_rgpd?: boolean
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          for_whom?: string | null
          id?: string
          is_demo?: boolean
          message?: string | null
          region_target?: string | null
          residence_id: string
          score?: number
          status?: Database["public"]["Enums"]["lead_status"]
          timing?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          anonymized_at?: string | null
          autonomy_level?: string | null
          budget_max?: number | null
          budget_min?: number | null
          budget_range?: string | null
          consent_rgpd?: boolean
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          for_whom?: string | null
          id?: string
          is_demo?: boolean
          message?: string | null
          region_target?: string | null
          residence_id?: string
          score?: number
          status?: Database["public"]["Enums"]["lead_status"]
          timing?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residence_search_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residence_stats_30d"
            referencedColumns: ["residence_id"]
          },
          {
            foreignKeyName: "leads_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "v_residence_price_summary"
            referencedColumns: ["residence_id"]
          },
        ]
      }
      org_invitations: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          email: string | null
          expires_at: string
          id: string
          org_id: string
          role_in_org: Database["public"]["Enums"]["org_role"]
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          expires_at?: string
          id?: string
          org_id: string
          role_in_org?: Database["public"]["Enums"]["org_role"]
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          expires_at?: string
          id?: string
          org_id?: string
          role_in_org?: Database["public"]["Enums"]["org_role"]
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      org_members: {
        Row: {
          created_at: string
          id: string
          org_id: string
          role_in_org: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          role_in_org?: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          role_in_org?: Database["public"]["Enums"]["org_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
          vat_number: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
          vat_number?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
          vat_number?: string | null
        }
        Relationships: []
      }
      photos: {
        Row: {
          alt_text: string | null
          category: Database["public"]["Enums"]["photo_category"]
          created_at: string
          display_order: number
          id: string
          residence_id: string
          storage_path: string
          title: string | null
        }
        Insert: {
          alt_text?: string | null
          category?: Database["public"]["Enums"]["photo_category"]
          created_at?: string
          display_order?: number
          id?: string
          residence_id: string
          storage_path: string
          title?: string | null
        }
        Update: {
          alt_text?: string | null
          category?: Database["public"]["Enums"]["photo_category"]
          created_at?: string
          display_order?: number
          id?: string
          residence_id?: string
          storage_path?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photos_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residence_search_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residence_stats_30d"
            referencedColumns: ["residence_id"]
          },
          {
            foreignKeyName: "photos_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "v_residence_price_summary"
            referencedColumns: ["residence_id"]
          },
        ]
      }
      pricing: {
        Row: {
          buy_max: number | null
          buy_min: number | null
          common_options: Json
          created_at: string
          estimated_monthly_max: number | null
          estimated_monthly_min: number | null
          fixed_charges: number | null
          id: string
          mandatory_pack: number | null
          occupation_mode: Database["public"]["Enums"]["occupation_mode"]
          rent_max: number | null
          rent_min: number | null
          unit_type_id: string
          updated_at: string
        }
        Insert: {
          buy_max?: number | null
          buy_min?: number | null
          common_options?: Json
          created_at?: string
          estimated_monthly_max?: number | null
          estimated_monthly_min?: number | null
          fixed_charges?: number | null
          id?: string
          mandatory_pack?: number | null
          occupation_mode: Database["public"]["Enums"]["occupation_mode"]
          rent_max?: number | null
          rent_min?: number | null
          unit_type_id: string
          updated_at?: string
        }
        Update: {
          buy_max?: number | null
          buy_min?: number | null
          common_options?: Json
          created_at?: string
          estimated_monthly_max?: number | null
          estimated_monthly_min?: number | null
          fixed_charges?: number | null
          id?: string
          mandatory_pack?: number | null
          occupation_mode?: Database["public"]["Enums"]["occupation_mode"]
          rent_max?: number | null
          rent_min?: number | null
          unit_type_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_unit_type_id_fkey"
            columns: ["unit_type_id"]
            isOneToOne: false
            referencedRelation: "unit_types"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: string
          created_at: string
          display_name: string | null
          language: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type?: string
          created_at?: string
          display_name?: string | null
          language?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_type?: string
          created_at?: string
          display_name?: string | null
          language?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      residence_activities: {
        Row: {
          activity_id: string
          created_at: string
          frequency: string | null
          id: string
          managed_by: string | null
          residence_id: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          frequency?: string | null
          id?: string
          managed_by?: string | null
          residence_id: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          frequency?: string | null
          id?: string
          managed_by?: string | null
          residence_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "residence_activities_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "residence_activities_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residence_search_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "residence_activities_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residence_stats_30d"
            referencedColumns: ["residence_id"]
          },
          {
            foreignKeyName: "residence_activities_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "residence_activities_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "v_residence_price_summary"
            referencedColumns: ["residence_id"]
          },
        ]
      }
      residence_charges: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          is_mandatory: boolean
          label: string
          residence_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          is_mandatory?: boolean
          label: string
          residence_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          is_mandatory?: boolean
          label?: string
          residence_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "residence_charges_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residence_search_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "residence_charges_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residence_stats_30d"
            referencedColumns: ["residence_id"]
          },
          {
            foreignKeyName: "residence_charges_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "residence_charges_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "v_residence_price_summary"
            referencedColumns: ["residence_id"]
          },
        ]
      }
      residence_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          referrer: string | null
          residence_id: string
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          referrer?: string | null
          residence_id: string
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          referrer?: string | null
          residence_id?: string
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "residence_events_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residence_search_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "residence_events_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residence_stats_30d"
            referencedColumns: ["residence_id"]
          },
          {
            foreignKeyName: "residence_events_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "residence_events_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "v_residence_price_summary"
            referencedColumns: ["residence_id"]
          },
        ]
      }
      residence_services: {
        Row: {
          charges_label: string | null
          comment_fr: string | null
          comment_nl: string | null
          created_at: string
          from_charges: boolean
          id: string
          included: boolean
          is_free: boolean
          optional: boolean
          price: number | null
          residence_id: string
          service_id: string
          updated_at: string
        }
        Insert: {
          charges_label?: string | null
          comment_fr?: string | null
          comment_nl?: string | null
          created_at?: string
          from_charges?: boolean
          id?: string
          included?: boolean
          is_free?: boolean
          optional?: boolean
          price?: number | null
          residence_id: string
          service_id: string
          updated_at?: string
        }
        Update: {
          charges_label?: string | null
          comment_fr?: string | null
          comment_nl?: string | null
          created_at?: string
          from_charges?: boolean
          id?: string
          included?: boolean
          is_free?: boolean
          optional?: boolean
          price?: number | null
          residence_id?: string
          service_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "residence_services_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residence_search_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "residence_services_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residence_stats_30d"
            referencedColumns: ["residence_id"]
          },
          {
            foreignKeyName: "residence_services_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "residence_services_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "v_residence_price_summary"
            referencedColumns: ["residence_id"]
          },
          {
            foreignKeyName: "residence_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      residence_versions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          reason: string | null
          residence_id: string
          snapshot_json: Json
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          reason?: string | null
          residence_id: string
          snapshot_json: Json
          version_number: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          reason?: string | null
          residence_id?: string
          snapshot_json?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "residence_versions_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residence_search_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "residence_versions_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residence_stats_30d"
            referencedColumns: ["residence_id"]
          },
          {
            foreignKeyName: "residence_versions_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "residence_versions_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "v_residence_price_summary"
            referencedColumns: ["residence_id"]
          },
        ]
      }
      residences: {
        Row: {
          adresse: string | null
          capacity: number | null
          code_postal: string | null
          commune: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_reason: string | null
          description_fr: string | null
          description_nl: string | null
          id: string
          is_demo: boolean
          latitude: number | null
          longitude: number | null
          nom_fr: string
          nom_nl: string | null
          org_id: string
          pays: string
          province: string | null
          proximity: Json
          published_at: string | null
          region: string | null
          rejected_reason: string | null
          slug: string
          status: Database["public"]["Enums"]["publication_status"]
          tagline_fr: string | null
          tagline_nl: string | null
          type_etablissement: Database["public"]["Enums"]["establishment_type"]
          updated_at: string
          ville: string | null
          website: string | null
        }
        Insert: {
          adresse?: string | null
          capacity?: number | null
          code_postal?: string | null
          commune?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_reason?: string | null
          description_fr?: string | null
          description_nl?: string | null
          id?: string
          is_demo?: boolean
          latitude?: number | null
          longitude?: number | null
          nom_fr: string
          nom_nl?: string | null
          org_id: string
          pays?: string
          province?: string | null
          proximity?: Json
          published_at?: string | null
          region?: string | null
          rejected_reason?: string | null
          slug: string
          status?: Database["public"]["Enums"]["publication_status"]
          tagline_fr?: string | null
          tagline_nl?: string | null
          type_etablissement: Database["public"]["Enums"]["establishment_type"]
          updated_at?: string
          ville?: string | null
          website?: string | null
        }
        Update: {
          adresse?: string | null
          capacity?: number | null
          code_postal?: string | null
          commune?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_reason?: string | null
          description_fr?: string | null
          description_nl?: string | null
          id?: string
          is_demo?: boolean
          latitude?: number | null
          longitude?: number | null
          nom_fr?: string
          nom_nl?: string | null
          org_id?: string
          pays?: string
          province?: string | null
          proximity?: Json
          published_at?: string | null
          region?: string | null
          rejected_reason?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["publication_status"]
          tagline_fr?: string | null
          tagline_nl?: string | null
          type_etablissement?: Database["public"]["Enums"]["establishment_type"]
          updated_at?: string
          ville?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "residences_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      services_catalog: {
        Row: {
          category: string | null
          code: string
          created_at: string
          created_by_residence: string | null
          icon: string | null
          id: string
          is_custom: boolean
          label_fr: string
          label_nl: string | null
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string
          created_by_residence?: string | null
          icon?: string | null
          id?: string
          is_custom?: boolean
          label_fr: string
          label_nl?: string | null
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string
          created_by_residence?: string | null
          icon?: string | null
          id?: string
          is_custom?: boolean
          label_fr?: string
          label_nl?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_catalog_created_by_residence_fkey"
            columns: ["created_by_residence"]
            isOneToOne: false
            referencedRelation: "residence_search_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_catalog_created_by_residence_fkey"
            columns: ["created_by_residence"]
            isOneToOne: false
            referencedRelation: "residence_stats_30d"
            referencedColumns: ["residence_id"]
          },
          {
            foreignKeyName: "services_catalog_created_by_residence_fkey"
            columns: ["created_by_residence"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_catalog_created_by_residence_fkey"
            columns: ["created_by_residence"]
            isOneToOne: false
            referencedRelation: "v_residence_price_summary"
            referencedColumns: ["residence_id"]
          },
        ]
      }
      unit_types: {
        Row: {
          available_count: number
          available_now: boolean
          count_total: number
          created_at: string
          id: string
          residence_id: string
          surface_max: number | null
          surface_min: number | null
          type: string
          updated_at: string
          waiting_delay_days: number | null
          waiting_list: boolean
        }
        Insert: {
          available_count?: number
          available_now?: boolean
          count_total?: number
          created_at?: string
          id?: string
          residence_id: string
          surface_max?: number | null
          surface_min?: number | null
          type: string
          updated_at?: string
          waiting_delay_days?: number | null
          waiting_list?: boolean
        }
        Update: {
          available_count?: number
          available_now?: boolean
          count_total?: number
          created_at?: string
          id?: string
          residence_id?: string
          surface_max?: number | null
          surface_min?: number | null
          type?: string
          updated_at?: string
          waiting_delay_days?: number | null
          waiting_list?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "unit_types_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residence_search_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_types_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residence_stats_30d"
            referencedColumns: ["residence_id"]
          },
          {
            foreignKeyName: "unit_types_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_types_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "v_residence_price_summary"
            referencedColumns: ["residence_id"]
          },
        ]
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
    }
    Views: {
      apartment_search_view: {
        Row: {
          available_from: string | null
          cave: boolean | null
          charges_monthly: number | null
          code_postal: string | null
          cover_path: string | null
          description_fr: string | null
          description_nl: string | null
          elevator: boolean | null
          floor: number | null
          furnished: boolean | null
          garden: boolean | null
          id: string | null
          is_demo: boolean | null
          kitchen_equipped: boolean | null
          parking: boolean | null
          province: string | null
          region: string | null
          rent_price: number | null
          residence_id: string | null
          residence_nom_fr: string | null
          residence_nom_nl: string | null
          residence_slug: string | null
          residence_type:
            | Database["public"]["Enums"]["establishment_type"]
            | null
          sale_price: number | null
          status: string | null
          surface_m2: number | null
          terrace: boolean | null
          title_fr: string | null
          title_nl: string | null
          transaction_type: string | null
          type: string | null
          ville: string | null
          wheelchair_accessible: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "apartments_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residence_search_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apartments_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residence_stats_30d"
            referencedColumns: ["residence_id"]
          },
          {
            foreignKeyName: "apartments_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apartments_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "v_residence_price_summary"
            referencedColumns: ["residence_id"]
          },
        ]
      }
      residence_search_view: {
        Row: {
          adresse: string | null
          capacity: number | null
          code_postal: string | null
          completeness: number | null
          cover_path: string | null
          has_availability: boolean | null
          id: string | null
          included_service_codes: string[] | null
          is_complete: boolean | null
          is_pmr: boolean | null
          nom_fr: string | null
          nom_nl: string | null
          price_from: number | null
          province: string | null
          published_at: string | null
          region: string | null
          rent_from: number | null
          slug: string | null
          status: Database["public"]["Enums"]["publication_status"] | null
          tagline_fr: string | null
          tagline_nl: string | null
          type_etablissement:
            | Database["public"]["Enums"]["establishment_type"]
            | null
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          capacity?: number | null
          code_postal?: string | null
          completeness?: never
          cover_path?: never
          has_availability?: never
          id?: string | null
          included_service_codes?: never
          is_complete?: never
          is_pmr?: never
          nom_fr?: string | null
          nom_nl?: string | null
          price_from?: never
          province?: string | null
          published_at?: string | null
          region?: string | null
          rent_from?: never
          slug?: string | null
          status?: Database["public"]["Enums"]["publication_status"] | null
          tagline_fr?: string | null
          tagline_nl?: string | null
          type_etablissement?:
            | Database["public"]["Enums"]["establishment_type"]
            | null
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          capacity?: number | null
          code_postal?: string | null
          completeness?: never
          cover_path?: never
          has_availability?: never
          id?: string | null
          included_service_codes?: never
          is_complete?: never
          is_pmr?: never
          nom_fr?: string | null
          nom_nl?: string | null
          price_from?: never
          province?: string | null
          published_at?: string | null
          region?: string | null
          rent_from?: never
          slug?: string | null
          status?: Database["public"]["Enums"]["publication_status"] | null
          tagline_fr?: string | null
          tagline_nl?: string | null
          type_etablissement?:
            | Database["public"]["Enums"]["establishment_type"]
            | null
          ville?: string | null
        }
        Relationships: []
      }
      residence_stats_30d: {
        Row: {
          clicks_contact_30d: number | null
          clicks_email_30d: number | null
          clicks_phone_30d: number | null
          clicks_website_30d: number | null
          favorites_total: number | null
          leads_30d: number | null
          residence_id: string | null
          views_30d: number | null
        }
        Relationships: []
      }
      v_residence_price_summary: {
        Row: {
          org_id: string | null
          price_max: number | null
          price_min: number | null
          residence_id: string | null
          status: Database["public"]["Enums"]["publication_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "residences_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_org_invitation: { Args: { _code: string }; Returns: string }
      admin_claim_residence: { Args: { _residence_id: string }; Returns: Json }
      admin_list_residences_with_orgs: {
        Args: never
        Returns: {
          id: string
          nom_fr: string
          org_id: string
          owner_email: string
          status: string
          ville: string
        }[]
      }
      anonymize_my_account: { Args: never; Returns: undefined }
      approve_residence: { Args: { _residence_id: string }; Returns: undefined }
      archive_residence: {
        Args: { _reason?: string; _residence_id: string }
        Returns: Json
      }
      can_manage_residence: {
        Args: { _residence_id: string; _user_id: string }
        Returns: boolean
      }
      create_organization_with_owner: {
        Args: {
          _contact_email: string
          _contact_phone: string
          _name: string
          _slug: string
        }
        Returns: string
      }
      ensure_demo_org: { Args: never; Returns: string }
      export_my_data: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      log_lead_view: { Args: { _lead_id: string }; Returns: undefined }
      promote_email_to_admin: { Args: { _email: string }; Returns: undefined }
      purge_demo_apartments: { Args: never; Returns: Json }
      purge_demo_data: { Args: never; Returns: Json }
      purge_old_leads: { Args: { _months?: number }; Returns: number }
      reject_residence: {
        Args: { _reason: string; _residence_id: string }
        Returns: undefined
      }
      residence_completeness: {
        Args: { _residence_id: string }
        Returns: number
      }
      residence_is_published: {
        Args: { _residence_id: string }
        Returns: boolean
      }
      restore_residence_version: {
        Args: { _version_id: string }
        Returns: undefined
      }
      seed_demo_apartments: { Args: never; Returns: Json }
      seed_demo_data: { Args: never; Returns: Json }
      snapshot_residence: {
        Args: { _actor: string; _reason: string; _residence_id: string }
        Returns: undefined
      }
      storage_residence_id: { Args: { _name: string }; Returns: string }
      submit_lead: {
        Args: {
          _autonomy_level: string
          _budget_max: number
          _budget_min: number
          _budget_range: string
          _consent: boolean
          _contact_email: string
          _contact_name: string
          _contact_phone: string
          _for_whom: string
          _message: string
          _region_target: string
          _residence_id: string
          _timing: string
        }
        Returns: string
      }
      submit_residence: { Args: { _residence_id: string }; Returns: undefined }
      unarchive_residence: { Args: { _residence_id: string }; Returns: Json }
      unit_type_residence: { Args: { _unit_type_id: string }; Returns: string }
      update_demo_photos_unsplash: { Args: never; Returns: number }
      update_lead_status: {
        Args: {
          _lead_id: string
          _status: Database["public"]["Enums"]["lead_status"]
        }
        Returns: undefined
      }
      user_org_ids: { Args: { _user_id: string }; Returns: string[] }
    }
    Enums: {
      app_role: "public" | "caregiver" | "partner_member" | "admin"
      establishment_type:
        | "residence_services"
        | "seigneurie"
        | "maison_repos"
        | "maison_repos_soins"
      lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "visit_scheduled"
        | "visit_done"
        | "won"
        | "lost"
      occupation_mode: "rent" | "buy" | "rent_or_buy"
      org_role: "owner" | "manager" | "member"
      photo_category:
        | "exterior"
        | "common_area"
        | "apartment"
        | "dining"
        | "garden"
        | "medical"
        | "activity"
        | "other"
        | "cover"
      publication_status:
        | "draft"
        | "pending"
        | "published"
        | "rejected"
        | "archived"
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
      app_role: ["public", "caregiver", "partner_member", "admin"],
      establishment_type: [
        "residence_services",
        "seigneurie",
        "maison_repos",
        "maison_repos_soins",
      ],
      lead_status: [
        "new",
        "contacted",
        "qualified",
        "visit_scheduled",
        "visit_done",
        "won",
        "lost",
      ],
      occupation_mode: ["rent", "buy", "rent_or_buy"],
      org_role: ["owner", "manager", "member"],
      photo_category: [
        "exterior",
        "common_area",
        "apartment",
        "dining",
        "garden",
        "medical",
        "activity",
        "other",
        "cover",
      ],
      publication_status: [
        "draft",
        "pending",
        "published",
        "rejected",
        "archived",
      ],
    },
  },
} as const
