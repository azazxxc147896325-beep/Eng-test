
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "attempt_items": {
                  Row: {
                    "attempt_id": string,"choice_order": NonNullable<Json>,"group_id": string | null,"id": string,"ordinal": number,"part": number,"question_version_id": string,"section": string
                  }
                  Insert: {
                    "attempt_id": string,"choice_order": NonNullable<Json>,"group_id"?: string | null,"id"?: string,"ordinal": number,"part": number,"question_version_id": string,"section": string
                  }
                  Update: {
                    "attempt_id"?: string,"choice_order"?: NonNullable<Json>,"group_id"?: string | null,"id"?: string,"ordinal"?: number,"part"?: number,"question_version_id"?: string,"section"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "attempt_items_attempt_id_fkey"
      columns: ["attempt_id"]
isOneToOne: false
      referencedRelation: "attempts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attempt_items_group_id_fkey"
      columns: ["group_id"]
isOneToOne: false
      referencedRelation: "question_groups"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attempt_items_question_version_id_fkey"
      columns: ["question_version_id"]
isOneToOne: false
      referencedRelation: "question_versions"
      referencedColumns: ["id"]
    }
                  ]
                },"attempts": {
                  Row: {
                    "blueprint_id": string | null,"current_section": string,"id": string,"idempotency_key": string,"locale": string,"mode": Database["public"]['Enums']["exam_mode"],"section_expires_at": string | null,"seed": string,"started_at": string,"status": Database["public"]['Enums']["attempt_status"],"submitted_at": string | null,"timing_unverified": boolean,"user_id": string
                  }
                  Insert: {
                    "blueprint_id"?: string | null,"current_section": string,"id"?: string,"idempotency_key": string,"locale": string,"mode": Database["public"]['Enums']["exam_mode"],"section_expires_at"?: string | null,"seed": string,"started_at"?: string,"status"?: Database["public"]['Enums']["attempt_status"],"submitted_at"?: string | null,"timing_unverified"?: boolean,"user_id": string
                  }
                  Update: {
                    "blueprint_id"?: string | null,"current_section"?: string,"id"?: string,"idempotency_key"?: string,"locale"?: string,"mode"?: Database["public"]['Enums']["exam_mode"],"section_expires_at"?: string | null,"seed"?: string,"started_at"?: string,"status"?: Database["public"]['Enums']["attempt_status"],"submitted_at"?: string | null,"timing_unverified"?: boolean,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "attempts_blueprint_id_fkey"
      columns: ["blueprint_id"]
isOneToOne: false
      referencedRelation: "test_blueprints"
      referencedColumns: ["id"]
    }
                  ]
                },"audit_logs": {
                  Row: {
                    "action": string,"actor_id": string | null,"after_data": Json | null,"before_data": Json | null,"created_at": string,"entity_id": string | null,"entity_type": string,"id": number
                  }
                  Insert: {
                    "action": string,"actor_id"?: string | null,"after_data"?: Json | null,"before_data"?: Json | null,"created_at"?: string,"entity_id"?: string | null,"entity_type": string,"id"?: never
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"after_data"?: Json | null,"before_data"?: Json | null,"created_at"?: string,"entity_id"?: string | null,"entity_type"?: string,"id"?: never
                  }
                  Relationships: [

                  ]
                },"choices": {
                  Row: {
                    "content": NonNullable<Json>,"id": string,"is_correct": boolean,"label": string,"position": number,"question_version_id": string
                  }
                  Insert: {
                    "content": NonNullable<Json>,"id"?: string,"is_correct"?: boolean,"label": string,"position": number,"question_version_id": string
                  }
                  Update: {
                    "content"?: NonNullable<Json>,"id"?: string,"is_correct"?: boolean,"label"?: string,"position"?: number,"question_version_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "choices_question_version_id_fkey"
      columns: ["question_version_id"]
isOneToOne: false
      referencedRelation: "question_versions"
      referencedColumns: ["id"]
    }
                  ]
                },"media": {
                  Row: {
                    "approved_by": string | null,"created_at": string,"created_by": string,"group_id": string | null,"id": string,"kind": string,"metadata": NonNullable<Json>,"question_version_id": string | null,"status": Database["public"]['Enums']["content_status"],"storage_path": string
                  }
                  Insert: {
                    "approved_by"?: string | null,"created_at"?: string,"created_by": string,"group_id"?: string | null,"id"?: string,"kind": string,"metadata"?: NonNullable<Json>,"question_version_id"?: string | null,"status"?: Database["public"]['Enums']["content_status"],"storage_path": string
                  }
                  Update: {
                    "approved_by"?: string | null,"created_at"?: string,"created_by"?: string,"group_id"?: string | null,"id"?: string,"kind"?: string,"metadata"?: NonNullable<Json>,"question_version_id"?: string | null,"status"?: Database["public"]['Enums']["content_status"],"storage_path"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "media_group_id_fkey"
      columns: ["group_id"]
isOneToOne: false
      referencedRelation: "question_groups"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "media_question_version_id_fkey"
      columns: ["question_version_id"]
isOneToOne: false
      referencedRelation: "question_versions"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "avatar_url": string | null,"created_at": string,"display_name": string | null,"id": string,"locale": string,"target_score": number,"updated_at": string
                  }
                  Insert: {
                    "avatar_url"?: string | null,"created_at"?: string,"display_name"?: string | null,"id": string,"locale"?: string,"target_score"?: number,"updated_at"?: string
                  }
                  Update: {
                    "avatar_url"?: string | null,"created_at"?: string,"display_name"?: string | null,"id"?: string,"locale"?: string,"target_score"?: number,"updated_at"?: string
                  }
                  Relationships: [

                  ]
                },"question_groups": {
                  Row: {
                    "approved_by": string | null,"created_at": string,"created_by": string,"difficulty": string,"group_type": string,"id": string,"part": number,"status": Database["public"]['Enums']["content_status"],"updated_at": string
                  }
                  Insert: {
                    "approved_by"?: string | null,"created_at"?: string,"created_by": string,"difficulty": string,"group_type": string,"id"?: string,"part": number,"status"?: Database["public"]['Enums']["content_status"],"updated_at"?: string
                  }
                  Update: {
                    "approved_by"?: string | null,"created_at"?: string,"created_by"?: string,"difficulty"?: string,"group_type"?: string,"id"?: string,"part"?: number,"status"?: Database["public"]['Enums']["content_status"],"updated_at"?: string
                  }
                  Relationships: []
                },"question_versions": {
                  Row: {
                    "approved_by": string | null,"choice_shuffle_allowed": boolean,"content_hash": string,"created_at": string,"created_by": string,"difficulty": string,"group_id": string | null,"id": string,"prompt": NonNullable<Json>,"question_id": string,"skill_tags": (string)[],"solution": NonNullable<Json>,"status": Database["public"]['Enums']["content_status"],"version": number
                  }
                  Insert: {
                    "approved_by"?: string | null,"choice_shuffle_allowed"?: boolean,"content_hash": string,"created_at"?: string,"created_by": string,"difficulty": string,"group_id"?: string | null,"id"?: string,"prompt": NonNullable<Json>,"question_id": string,"skill_tags"?: (string)[],"solution": NonNullable<Json>,"status"?: Database["public"]['Enums']["content_status"],"version": number
                  }
                  Update: {
                    "approved_by"?: string | null,"choice_shuffle_allowed"?: boolean,"content_hash"?: string,"created_at"?: string,"created_by"?: string,"difficulty"?: string,"group_id"?: string | null,"id"?: string,"prompt"?: NonNullable<Json>,"question_id"?: string,"skill_tags"?: (string)[],"solution"?: NonNullable<Json>,"status"?: Database["public"]['Enums']["content_status"],"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "question_versions_group_id_fkey"
      columns: ["group_id"]
isOneToOne: false
      referencedRelation: "question_groups"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "question_versions_question_id_fkey"
      columns: ["question_id"]
isOneToOne: false
      referencedRelation: "questions"
      referencedColumns: ["id"]
    }
                  ]
                },"questions": {
                  Row: {
                    "created_at": string,"created_by": string,"id": string,"part": number
                  }
                  Insert: {
                    "created_at"?: string,"created_by": string,"id"?: string,"part": number
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string,"id"?: string,"part"?: number
                  }
                  Relationships: []
                },"responses": {
                  Row: {
                    "answered_at": string,"attempt_id": string,"attempt_item_id": string,"choice_id": string | null,"id": string,"marked": boolean,"user_id": string
                  }
                  Insert: {
                    "answered_at"?: string,"attempt_id": string,"attempt_item_id": string,"choice_id"?: string | null,"id"?: string,"marked"?: boolean,"user_id": string
                  }
                  Update: {
                    "answered_at"?: string,"attempt_id"?: string,"attempt_item_id"?: string,"choice_id"?: string | null,"id"?: string,"marked"?: boolean,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "responses_attempt_id_fkey"
      columns: ["attempt_id"]
isOneToOne: false
      referencedRelation: "attempts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "responses_attempt_item_id_fkey"
      columns: ["attempt_item_id"]
isOneToOne: false
      referencedRelation: "attempt_items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "responses_choice_id_fkey"
      columns: ["choice_id"]
isOneToOne: false
      referencedRelation: "choices"
      referencedColumns: ["id"]
    }
                  ]
                },"review_events": {
                  Row: {
                    "action": string,"actor_id": string,"created_at": string,"id": number,"notes": string | null,"question_version_id": string
                  }
                  Insert: {
                    "action": string,"actor_id": string,"created_at"?: string,"id"?: never,"notes"?: string | null,"question_version_id": string
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string,"created_at"?: string,"id"?: never,"notes"?: string | null,"question_version_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "review_events_question_version_id_fkey"
      columns: ["question_version_id"]
isOneToOne: false
      referencedRelation: "question_versions"
      referencedColumns: ["id"]
    }
                  ]
                },"score_results": {
                  Row: {
                    "attempt_id": string,"breakdown": NonNullable<Json>,"created_at": string,"id": string,"listening_raw": number | null,"listening_scaled": number | null,"reading_raw": number | null,"reading_scaled": number | null,"scoring_version": string,"total_scaled": number | null,"user_id": string
                  }
                  Insert: {
                    "attempt_id": string,"breakdown"?: NonNullable<Json>,"created_at"?: string,"id"?: string,"listening_raw"?: number | null,"listening_scaled"?: number | null,"reading_raw"?: number | null,"reading_scaled"?: number | null,"scoring_version": string,"total_scaled"?: number | null,"user_id": string
                  }
                  Update: {
                    "attempt_id"?: string,"breakdown"?: NonNullable<Json>,"created_at"?: string,"id"?: string,"listening_raw"?: number | null,"listening_scaled"?: number | null,"reading_raw"?: number | null,"reading_scaled"?: number | null,"scoring_version"?: string,"total_scaled"?: number | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "score_results_attempt_id_fkey"
      columns: ["attempt_id"]
isOneToOne: true
      referencedRelation: "attempts"
      referencedColumns: ["id"]
    }
                  ]
                },"test_blueprints": {
                  Row: {
                    "active": boolean,"created_at": string,"definition": NonNullable<Json>,"id": string,"mode": Database["public"]['Enums']["exam_mode"],"name": string,"version": number
                  }
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"definition": NonNullable<Json>,"id"?: string,"mode": Database["public"]['Enums']["exam_mode"],"name": string,"version": number
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"definition"?: NonNullable<Json>,"id"?: string,"mode"?: Database["public"]['Enums']["exam_mode"],"name"?: string,"version"?: number
                  }
                  Relationships: []
                },"translations": {
                  Row: {
                    "explanation": string,"id": string,"locale": string,"prompt_translation": string | null,"question_version_id": string,"status": Database["public"]['Enums']["content_status"],"transcript": string | null
                  }
                  Insert: {
                    "explanation": string,"id"?: string,"locale": string,"prompt_translation"?: string | null,"question_version_id": string,"status"?: Database["public"]['Enums']["content_status"],"transcript"?: string | null
                  }
                  Update: {
                    "explanation"?: string,"id"?: string,"locale"?: string,"prompt_translation"?: string | null,"question_version_id"?: string,"status"?: Database["public"]['Enums']["content_status"],"transcript"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "translations_question_version_id_fkey"
      columns: ["question_version_id"]
isOneToOne: false
      referencedRelation: "question_versions"
      referencedColumns: ["id"]
    }
                  ]
                },"user_roles": {
                  Row: {
                    "created_at": string,"role": Database["public"]['Enums']["app_role"],"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"role"?: Database["public"]['Enums']["app_role"],"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"role"?: Database["public"]['Enums']["app_role"],"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            "content_pool_coverage": {
                  Row: {
                    "complete_groups": number | null,"draft_groups": number | null,"part": number | null,"published_questions": number | null,"review_groups": number | null
                  }
                  Relationships: []
                }
          }
          Functions: {
            "create_attempt_snapshot":
{ Args: { "p_blueprint_id": string,"p_current_section": string,"p_idempotency_key": string,"p_items": Json,"p_locale": string,"p_mode": Database["public"]['Enums']["exam_mode"],"p_section_duration_minutes": number,"p_seed": string,"p_user_id": string }; Returns: string
                           },
"has_role":
{ Args: { "required_role": Database["public"]['Enums']["app_role"] }; Returns: boolean
                           },
"submit_attempt":
{ Args: { "p_attempt_id": string,"p_scoring_version": string,"p_user_id": string }; Returns: string
                           },
"transition_question_version":
{ Args: { "p_notes"?: string,"p_question_version_id": string,"p_target_status": Database["public"]['Enums']["content_status"] }; Returns: Database["public"]['Enums']["content_status"]
                           },
"save_generated_content_draft":
{ Args: { "p_draft": Json }; Returns: string
                           },
"save_content_drafts":
{ Args: { "p_drafts": Json }; Returns: number
                           },
"set_user_staff_role":
{ Args: { "p_role": Database["public"]['Enums']["app_role"],"p_user_id": string }; Returns: undefined
                           }
          }
          Enums: {
            "app_role": "admin"|"reviewer"|"user","attempt_status": "in_progress"|"section_complete"|"submitted"|"expired"|"abandoned","content_status": "draft"|"checks_passed"|"in_review"|"approved"|"published"|"retired","exam_mode": "full"|"quick"|"practice"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "app_role": ["admin", "reviewer", "user"],"attempt_status": ["in_progress", "section_complete", "submitted", "expired", "abandoned"],"content_status": ["draft", "checks_passed", "in_review", "approved", "published", "retired"],"exam_mode": ["full", "quick", "practice"]
          }
        }
} as const
