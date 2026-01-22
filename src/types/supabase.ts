export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: '14.1';
    };
    public: {
        Tables: {
            food_log: {
                Row: {
                    calories: number;
                    carbs: number;
                    confidence: number | null;
                    created_at: string | null;
                    date: string;
                    description: string | null;
                    fat: number;
                    fiber: number;
                    id: string;
                    meal: string;
                    name: string;
                    protein: number;
                    reviewed: boolean;
                    source: string;
                    source_id: string | null;
                    time: string | null;
                    updated_at: string | null;
                    user_id: string;
                };
                Insert: {
                    calories?: number;
                    carbs?: number;
                    confidence?: number | null;
                    created_at?: string | null;
                    date: string;
                    description?: string | null;
                    fat?: number;
                    fiber?: number;
                    id?: string;
                    meal: string;
                    name: string;
                    protein?: number;
                    reviewed?: boolean;
                    source?: string;
                    source_id?: string | null;
                    time?: string | null;
                    updated_at?: string | null;
                    user_id: string;
                };
                Update: {
                    calories?: number;
                    carbs?: number;
                    confidence?: number | null;
                    created_at?: string | null;
                    date?: string;
                    description?: string | null;
                    fat?: number;
                    fiber?: number;
                    id?: string;
                    meal?: string;
                    name?: string;
                    protein?: number;
                    reviewed?: boolean;
                    source?: string;
                    source_id?: string | null;
                    time?: string | null;
                    updated_at?: string | null;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'food_log_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            meal_templates: {
                Row: {
                    calories: number;
                    carbs: number;
                    created_at: string | null;
                    description: string | null;
                    fat: number;
                    fiber: number;
                    id: string;
                    meal: string;
                    name: string;
                    protein: number;
                    updated_at: string | null;
                    user_id: string;
                };
                Insert: {
                    calories?: number;
                    carbs?: number;
                    created_at?: string | null;
                    description?: string | null;
                    fat?: number;
                    fiber?: number;
                    id?: string;
                    meal: string;
                    name: string;
                    protein?: number;
                    updated_at?: string | null;
                    user_id: string;
                };
                Update: {
                    calories?: number;
                    carbs?: number;
                    created_at?: string | null;
                    description?: string | null;
                    fat?: number;
                    fiber?: number;
                    id?: string;
                    meal?: string;
                    name?: string;
                    protein?: number;
                    updated_at?: string | null;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'meal_templates_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            oura_log: {
                Row: {
                    activity_score: number | null;
                    created_at: string | null;
                    date: string;
                    deep_sleep_mins: number | null;
                    hrv: number | null;
                    id: string;
                    readiness_score: number | null;
                    rem_sleep_mins: number | null;
                    resting_hr: number | null;
                    sleep_hours: number | null;
                    sleep_score: number | null;
                    user_id: string;
                };
                Insert: {
                    activity_score?: number | null;
                    created_at?: string | null;
                    date: string;
                    deep_sleep_mins?: number | null;
                    hrv?: number | null;
                    id?: string;
                    readiness_score?: number | null;
                    rem_sleep_mins?: number | null;
                    resting_hr?: number | null;
                    sleep_hours?: number | null;
                    sleep_score?: number | null;
                    user_id: string;
                };
                Update: {
                    activity_score?: number | null;
                    created_at?: string | null;
                    date?: string;
                    deep_sleep_mins?: number | null;
                    hrv?: number | null;
                    id?: string;
                    readiness_score?: number | null;
                    rem_sleep_mins?: number | null;
                    resting_hr?: number | null;
                    sleep_hours?: number | null;
                    sleep_score?: number | null;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'oura_log_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            profiles: {
                Row: {
                    activity_level: string | null;
                    age: number | null;
                    avatar_url: string | null;
                    created_at: string | null;
                    current_weight: number | null;
                    display_name: string | null;
                    goal: string | null;
                    height: number | null;
                    id: string;
                    target_calories: number | null;
                    target_carbs: number | null;
                    target_fat: number | null;
                    target_fiber: number | null;
                    target_protein: number | null;
                    target_weight: number | null;
                    training_day_calories_bonus: number | null;
                    training_day_carbs: number | null;
                    updated_at: string | null;
                    user_id: string;
                };
                Insert: {
                    activity_level?: string | null;
                    age?: number | null;
                    avatar_url?: string | null;
                    created_at?: string | null;
                    current_weight?: number | null;
                    display_name?: string | null;
                    goal?: string | null;
                    height?: number | null;
                    id?: string;
                    target_calories?: number | null;
                    target_carbs?: number | null;
                    target_fat?: number | null;
                    target_fiber?: number | null;
                    target_protein?: number | null;
                    target_weight?: number | null;
                    training_day_calories_bonus?: number | null;
                    training_day_carbs?: number | null;
                    updated_at?: string | null;
                    user_id: string;
                };
                Update: {
                    activity_level?: string | null;
                    age?: number | null;
                    avatar_url?: string | null;
                    created_at?: string | null;
                    current_weight?: number | null;
                    display_name?: string | null;
                    goal?: string | null;
                    height?: number | null;
                    id?: string;
                    target_calories?: number | null;
                    target_carbs?: number | null;
                    target_fat?: number | null;
                    target_fiber?: number | null;
                    target_protein?: number | null;
                    target_weight?: number | null;
                    training_day_calories_bonus?: number | null;
                    training_day_carbs?: number | null;
                    updated_at?: string | null;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'profiles_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: true;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            steps_log: {
                Row: {
                    created_at: string | null;
                    date: string;
                    id: string;
                    steps: number;
                    user_id: string;
                };
                Insert: {
                    created_at?: string | null;
                    date: string;
                    id?: string;
                    steps: number;
                    user_id: string;
                };
                Update: {
                    created_at?: string | null;
                    date?: string;
                    id?: string;
                    steps?: number;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'steps_log_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            water_log: {
                Row: {
                    created_at: string | null;
                    date: string;
                    glasses: number;
                    id: string;
                    ml: number;
                    user_id: string;
                };
                Insert: {
                    created_at?: string | null;
                    date: string;
                    glasses?: number;
                    id?: string;
                    ml?: number;
                    user_id: string;
                };
                Update: {
                    created_at?: string | null;
                    date?: string;
                    glasses?: number;
                    id?: string;
                    ml?: number;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'water_log_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            weight_history: {
                Row: {
                    created_at: string | null;
                    date: string;
                    id: string;
                    user_id: string;
                    weight: number;
                };
                Insert: {
                    created_at?: string | null;
                    date: string;
                    id?: string;
                    user_id: string;
                    weight: number;
                };
                Update: {
                    created_at?: string | null;
                    date?: string;
                    id?: string;
                    user_id?: string;
                    weight?: number;
                };
                Relationships: [
                    {
                        foreignKeyName: 'weight_history_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            workouts: {
                Row: {
                    calories: number;
                    created_at: string | null;
                    date: string;
                    duration: number;
                    exercises: Json | null;
                    id: string;
                    name: string;
                    notes: string | null;
                    type: string;
                    updated_at: string | null;
                    user_id: string;
                    volume: number | null;
                };
                Insert: {
                    calories?: number;
                    created_at?: string | null;
                    date: string;
                    duration?: number;
                    exercises?: Json | null;
                    id?: string;
                    name: string;
                    notes?: string | null;
                    type: string;
                    updated_at?: string | null;
                    user_id: string;
                    volume?: number | null;
                };
                Update: {
                    calories?: number;
                    created_at?: string | null;
                    date?: string;
                    duration?: number;
                    exercises?: Json | null;
                    id?: string;
                    name?: string;
                    notes?: string | null;
                    type?: string;
                    updated_at?: string | null;
                    user_id?: string;
                    volume?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'workouts_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};

type PublicSchema = Database['public'];

export type Tables<
    PublicTableNameOrOptions extends
        | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
        | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
        ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
              Database[PublicTableNameOrOptions['schema']]['Views'])
        : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
          Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
          Row: infer R;
      }
        ? R
        : never
    : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] &
            PublicSchema['Views'])
      ? (PublicSchema['Tables'] &
            PublicSchema['Views'])[PublicTableNameOrOptions] extends {
            Row: infer R;
        }
          ? R
          : never
      : never;

export type TablesInsert<
    PublicTableNameOrOptions extends
        | keyof PublicSchema['Tables']
        | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
        ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
        : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Insert: infer I;
      }
        ? I
        : never
    : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
      ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
            Insert: infer I;
        }
          ? I
          : never
      : never;

export type TablesUpdate<
    PublicTableNameOrOptions extends
        | keyof PublicSchema['Tables']
        | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
        ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
        : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Update: infer U;
      }
        ? U
        : never
    : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
      ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
            Update: infer U;
        }
          ? U
          : never
      : never;

export type Enums<
    PublicEnumNameOrOptions extends
        | keyof PublicSchema['Enums']
        | { schema: keyof Database },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
        ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
        : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
    ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
    : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
      ? PublicSchema['Enums'][PublicEnumNameOrOptions]
      : never;

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
        | keyof PublicSchema['CompositeTypes']
        | { schema: keyof Database },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof Database;
    }
        ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
        : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
    ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof PublicSchema['CompositeTypes']
      ? PublicSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
      : never;

export const Constants = {
    public: {
        Enums: {},
    },
} as const;
