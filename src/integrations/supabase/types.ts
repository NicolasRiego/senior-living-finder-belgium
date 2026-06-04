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
      admin_ticket_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          ticket_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          ticket_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "admin_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_ticket_email_batches: {
        Row: {
          id: string
          last_sent_at: string
          ticket_id: string
          user_id: string
        }
        Insert: {
          id?: string
          last_sent_at?: string
          ticket_id: string
          user_id: string
        }
        Update: {
          id?: string
          last_sent_at?: string
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_ticket_email_batches_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "admin_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_ticket_participants: {
        Row: {
          created_at: string
          id: string
          ticket_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ticket_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_ticket_participants_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "admin_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_tickets: {
        Row: {
          created_at: string
          created_by: string
          deadline: string | null
          description: string | null
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          screenshots: string[]
          status: Database["public"]["Enums"]["ticket_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          deadline?: string | null
          description?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          screenshots?: string[]
          status?: Database["public"]["Enums"]["ticket_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          deadline?: string | null
          description?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          screenshots?: string[]
          status?: Database["public"]["Enums"]["ticket_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      apartment_additional_charges: {
        Row: {
          amount: number
          apartment_id: string
          created_at: string
          description: string | null
          id: string
          is_included: boolean
          label: string
          sort_order: number
        }
        Insert: {
          amount?: number
          apartment_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_included?: boolean
          label: string
          sort_order?: number
        }
        Update: {
          amount?: number
          apartment_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_included?: boolean
          label?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "apartment_additional_charges_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartment_search_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apartment_additional_charges_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
        ]
      }
      apartment_custom_equipment: {
        Row: {
          apartment_id: string
          created_at: string
          id: string
          is_checked: boolean
          label: string
          sort_order: number
        }
        Insert: {
          apartment_id: string
          created_at?: string
          id?: string
          is_checked?: boolean
          label: string
          sort_order?: number
        }
        Update: {
          apartment_id?: string
          created_at?: string
          id?: string
          is_checked?: boolean
          label?: string
          sort_order?: number
        }
        Relationships: []
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
          charges_description: string | null
          charges_monthly: number | null
          co_ownership_description: string | null
          co_ownership_fee: number | null
          co_ownership_included: boolean
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
          is_pinned: boolean
          kitchen_equipped: boolean
          kitchen_type: string | null
          living_room_m2: number | null
          orientation: string | null
          parking: boolean
          parking_count: number | null
          parking_type: string | null
          peb_certificate_name: string | null
          peb_certificate_uploaded_at: string | null
          peb_certificate_url: string | null
          peb_certificate_visible: boolean
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
          charges_description?: string | null
          charges_monthly?: number | null
          co_ownership_description?: string | null
          co_ownership_fee?: number | null
          co_ownership_included?: boolean
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
          is_pinned?: boolean
          kitchen_equipped?: boolean
          kitchen_type?: string | null
          living_room_m2?: number | null
          orientation?: string | null
          parking?: boolean
          parking_count?: number | null
          parking_type?: string | null
          peb_certificate_name?: string | null
          peb_certificate_uploaded_at?: string | null
          peb_certificate_url?: string | null
          peb_certificate_visible?: boolean
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
          charges_description?: string | null
          charges_monthly?: number | null
          co_ownership_description?: string | null
          co_ownership_fee?: number | null
          co_ownership_included?: boolean
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
          is_pinned?: boolean
          kitchen_equipped?: boolean
          kitchen_type?: string | null
          living_room_m2?: number | null
          orientation?: string | null
          parking?: boolean
          parking_count?: number | null
          parking_type?: string | null
          peb_certificate_name?: string | null
          peb_certificate_uploaded_at?: string | null
          peb_certificate_url?: string | null
          peb_certificate_visible?: boolean
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
      budget_simulations: {
        Row: {
          apartment_id: string
          created_at: string
          id: string
          name: string
          selected_services: Json
          total_annual: number
          total_monthly: number
          updated_at: string
          user_id: string
        }
        Insert: {
          apartment_id: string
          created_at?: string
          id?: string
          name: string
          selected_services?: Json
          total_annual?: number
          total_monthly?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          apartment_id?: string
          created_at?: string
          id?: string
          name?: string
          selected_services?: Json
          total_annual?: number
          total_monthly?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_campaign_contacts: {
        Row: {
          campaign_id: string
          contact_id: string
          created_at: string
          id: string
          status: Database["public"]["Enums"]["crm_campaign_contact_status"]
        }
        Insert: {
          campaign_id: string
          contact_id: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["crm_campaign_contact_status"]
        }
        Update: {
          campaign_id?: string
          contact_id?: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["crm_campaign_contact_status"]
        }
        Relationships: [
          {
            foreignKeyName: "crm_campaign_contacts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "crm_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_campaign_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_campaigns: {
        Row: {
          budget_estimated: number | null
          channel: Database["public"]["Enums"]["crm_campaign_channel"]
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          name: string
          objective: string | null
          results_contacts_reached: number
          results_new_partners: number
          results_positive_responses: number
          start_date: string | null
          status: Database["public"]["Enums"]["crm_campaign_status"]
          target_contacts: number
          updated_at: string
        }
        Insert: {
          budget_estimated?: number | null
          channel?: Database["public"]["Enums"]["crm_campaign_channel"]
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          name: string
          objective?: string | null
          results_contacts_reached?: number
          results_new_partners?: number
          results_positive_responses?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["crm_campaign_status"]
          target_contacts?: number
          updated_at?: string
        }
        Update: {
          budget_estimated?: number | null
          channel?: Database["public"]["Enums"]["crm_campaign_channel"]
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          name?: string
          objective?: string | null
          results_contacts_reached?: number
          results_new_partners?: number
          results_positive_responses?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["crm_campaign_status"]
          target_contacts?: number
          updated_at?: string
        }
        Relationships: []
      }
      crm_contacts: {
        Row: {
          address: string | null
          assigned_to: string | null
          city: string | null
          contact_firstname: string | null
          contact_lastname: string | null
          contact_role: string | null
          created_at: string
          created_by: string | null
          email: string | null
          group_id: string | null
          id: string
          name: string
          next_followup_date: string | null
          notes: string | null
          phone: string | null
          postal_code: string | null
          region: string | null
          residence_id: string | null
          source: Database["public"]["Enums"]["crm_contact_source"]
          status: Database["public"]["Enums"]["crm_contact_status"]
          type: Database["public"]["Enums"]["crm_contact_type"]
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          city?: string | null
          contact_firstname?: string | null
          contact_lastname?: string | null
          contact_role?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          group_id?: string | null
          id?: string
          name: string
          next_followup_date?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          region?: string | null
          residence_id?: string | null
          source?: Database["public"]["Enums"]["crm_contact_source"]
          status?: Database["public"]["Enums"]["crm_contact_status"]
          type?: Database["public"]["Enums"]["crm_contact_type"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          city?: string | null
          contact_firstname?: string | null
          contact_lastname?: string | null
          contact_role?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          group_id?: string | null
          id?: string
          name?: string
          next_followup_date?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          region?: string | null
          residence_id?: string | null
          source?: Database["public"]["Enums"]["crm_contact_source"]
          status?: Database["public"]["Enums"]["crm_contact_status"]
          type?: Database["public"]["Enums"]["crm_contact_type"]
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "crm_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residence_search_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residence_stats_30d"
            referencedColumns: ["residence_id"]
          },
          {
            foreignKeyName: "crm_contacts_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "v_residence_price_summary"
            referencedColumns: ["residence_id"]
          },
        ]
      }
      crm_groups: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          logo_url: string | null
          name: string
          notes: string | null
          sector: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          name: string
          notes?: string | null
          sector?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          notes?: string | null
          sector?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      crm_interactions: {
        Row: {
          contact_id: string
          content: string | null
          created_at: string
          created_by: string | null
          date: string
          id: string
          result: Database["public"]["Enums"]["crm_interaction_result"] | null
          summary: string
          type: Database["public"]["Enums"]["crm_interaction_type"]
        }
        Insert: {
          contact_id: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          result?: Database["public"]["Enums"]["crm_interaction_result"] | null
          summary: string
          type: Database["public"]["Enums"]["crm_interaction_type"]
        }
        Update: {
          contact_id?: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          result?: Database["public"]["Enums"]["crm_interaction_result"] | null
          summary?: string
          type?: Database["public"]["Enums"]["crm_interaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "crm_interactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tasks: {
        Row: {
          assigned_to: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          due_time: string | null
          id: string
          priority: Database["public"]["Enums"]["crm_task_priority"]
          status: Database["public"]["Enums"]["crm_task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["crm_task_priority"]
          status?: Database["public"]["Enums"]["crm_task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["crm_task_priority"]
          status?: Database["public"]["Enums"]["crm_task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_templates: {
        Row: {
          created_at: string
          created_by: string | null
          extra_instructions: string | null
          id: string
          is_default: boolean
          language: string
          message_type: string
          name: string
          tone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          extra_instructions?: string | null
          id?: string
          is_default?: boolean
          language?: string
          message_type: string
          name: string
          tone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          extra_instructions?: string | null
          id?: string
          is_default?: boolean
          language?: string
          message_type?: string
          name?: string
          tone?: string
          updated_at?: string
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
          is_super_admin: boolean
          language: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type?: string
          created_at?: string
          display_name?: string | null
          is_super_admin?: boolean
          language?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_type?: string
          created_at?: string
          display_name?: string | null
          is_super_admin?: boolean
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
          frequency_count: number | null
          frequency_period: string | null
          id: string
          managed_by: string | null
          residence_id: string
          responsable: string | null
        }
        Insert: {
          activity_id: string
          created_at?: string
          frequency?: string | null
          frequency_count?: number | null
          frequency_period?: string | null
          id?: string
          managed_by?: string | null
          residence_id: string
          responsable?: string | null
        }
        Update: {
          activity_id?: string
          created_at?: string
          frequency?: string | null
          frequency_count?: number | null
          frequency_period?: string | null
          id?: string
          managed_by?: string | null
          residence_id?: string
          responsable?: string | null
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
      residence_responsables_custom: {
        Row: {
          created_at: string
          id: string
          label: string
          residence_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          residence_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          residence_id?: string
        }
        Relationships: []
      }
      residence_services: {
        Row: {
          charges_label: string | null
          comment_fr: string | null
          comment_nl: string | null
          created_at: string
          deleted_at: string | null
          dinner_price: number | null
          from_charges: boolean
          id: string
          included: boolean
          is_available: boolean
          is_free: boolean
          lunch_price: number | null
          optional: boolean
          price: number | null
          price_unit: string | null
          residence_id: string
          service_id: string
          updated_at: string
        }
        Insert: {
          charges_label?: string | null
          comment_fr?: string | null
          comment_nl?: string | null
          created_at?: string
          deleted_at?: string | null
          dinner_price?: number | null
          from_charges?: boolean
          id?: string
          included?: boolean
          is_available?: boolean
          is_free?: boolean
          lunch_price?: number | null
          optional?: boolean
          price?: number | null
          price_unit?: string | null
          residence_id: string
          service_id: string
          updated_at?: string
        }
        Update: {
          charges_label?: string | null
          comment_fr?: string | null
          comment_nl?: string | null
          created_at?: string
          deleted_at?: string | null
          dinner_price?: number | null
          from_charges?: boolean
          id?: string
          included?: boolean
          is_available?: boolean
          is_free?: boolean
          lunch_price?: number | null
          optional?: boolean
          price?: number | null
          price_unit?: string | null
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
          is_pinned: boolean
          latitude: number | null
          longitude: number | null
          nom_fr: string
          nom_nl: string | null
          org_id: string
          pays: string
          pinned_at: string | null
          pmr_accessible: boolean
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
          is_pinned?: boolean
          latitude?: number | null
          longitude?: number | null
          nom_fr: string
          nom_nl?: string | null
          org_id: string
          pays?: string
          pinned_at?: string | null
          pmr_accessible?: boolean
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
          is_pinned?: boolean
          latitude?: number | null
          longitude?: number | null
          nom_fr?: string
          nom_nl?: string | null
          org_id?: string
          pays?: string
          pinned_at?: string | null
          pmr_accessible?: boolean
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
      saved_apartments: {
        Row: {
          apartment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          apartment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          apartment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
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
      simulator_logements: {
        Row: {
          added_at: string
          apartment_id: string
          id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          apartment_id: string
          id?: string
          user_id: string
        }
        Update: {
          added_at?: string
          apartment_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
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
          apartment_types: string[] | null
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
          surface_max: number | null
          surface_min: number | null
          tagline_fr: string | null
          tagline_nl: string | null
          type_etablissement:
            | Database["public"]["Enums"]["establishment_type"]
            | null
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          apartment_types?: never
          capacity?: never
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
          surface_max?: never
          surface_min?: never
          tagline_fr?: string | null
          tagline_nl?: string | null
          type_etablissement?:
            | Database["public"]["Enums"]["establishment_type"]
            | null
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          apartment_types?: never
          capacity?: never
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
          surface_max?: never
          surface_min?: never
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
      admin_assign_residence: {
        Args: { _residence_id: string; _target_user_id: string }
        Returns: Json
      }
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
      admin_list_ticket_comments: {
        Args: { _ticket_id: string }
        Returns: {
          author_email: string
          author_id: string
          author_name: string
          content: string
          created_at: string
          id: string
          ticket_id: string
        }[]
      }
      admin_list_ticket_participants: {
        Args: { _ticket_id: string }
        Returns: {
          display_name: string
          email: string
          user_id: string
        }[]
      }
      admin_list_tickets: {
        Args: never
        Returns: {
          comment_count: number
          created_at: string
          created_by: string
          creator_email: string
          creator_name: string
          deadline: string
          description: string
          id: string
          last_comment_at: string
          participant_count: number
          priority: Database["public"]["Enums"]["ticket_priority"]
          screenshots: string[]
          status: Database["public"]["Enums"]["ticket_status"]
          title: string
          updated_at: string
        }[]
      }
      admin_list_users: {
        Args: never
        Returns: {
          account_type: string
          created_at: string
          display_name: string
          email: string
          is_admin: boolean
          is_partner: boolean
          is_super_admin: boolean
          last_sign_in_at: string
          user_id: string
        }[]
      }
      admin_search_profiles_for_attribution: {
        Args: { _only_partners?: boolean; _query: string }
        Returns: {
          account_type: string
          display_name: string
          email: string
          is_partner: boolean
          user_id: string
        }[]
      }
      admin_set_user_role: {
        Args: { _role: string; _target_user_id: string }
        Returns: undefined
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
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
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
      crm_campaign_channel:
        | "email"
        | "linkedin"
        | "telephone"
        | "evenement"
        | "autre"
      crm_campaign_contact_status: "cible" | "contacte" | "repondu" | "converti"
      crm_campaign_status: "planifiee" | "en_cours" | "terminee"
      crm_contact_source:
        | "liste_interne"
        | "linkedin"
        | "recommandation"
        | "evenement"
        | "autre"
      crm_contact_status:
        | "a_contacter"
        | "contacte"
        | "en_discussion"
        | "demo_envoyee"
        | "partenaire"
        | "refus"
      crm_contact_type: "groupe" | "residence_independante"
      crm_interaction_result: "positif" | "neutre" | "negatif"
      crm_interaction_type: "appel" | "email" | "reunion" | "note"
      crm_task_priority: "faible" | "normale" | "urgente"
      crm_task_status: "a_faire" | "en_cours" | "termine"
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
      ticket_priority: "faible" | "moderee" | "importante"
      ticket_status: "a_reflechir" | "a_faire" | "en_cours" | "resolu"
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
      crm_campaign_channel: [
        "email",
        "linkedin",
        "telephone",
        "evenement",
        "autre",
      ],
      crm_campaign_contact_status: ["cible", "contacte", "repondu", "converti"],
      crm_campaign_status: ["planifiee", "en_cours", "terminee"],
      crm_contact_source: [
        "liste_interne",
        "linkedin",
        "recommandation",
        "evenement",
        "autre",
      ],
      crm_contact_status: [
        "a_contacter",
        "contacte",
        "en_discussion",
        "demo_envoyee",
        "partenaire",
        "refus",
      ],
      crm_contact_type: ["groupe", "residence_independante"],
      crm_interaction_result: ["positif", "neutre", "negatif"],
      crm_interaction_type: ["appel", "email", "reunion", "note"],
      crm_task_priority: ["faible", "normale", "urgente"],
      crm_task_status: ["a_faire", "en_cours", "termine"],
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
      ticket_priority: ["faible", "moderee", "importante"],
      ticket_status: ["a_reflechir", "a_faire", "en_cours", "resolu"],
    },
  },
} as const
