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
                Relationships: [];
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
                Relationships: [];
            };
            oura_log: {
                Row: {
                    activity_score: number | null;
                    bedtime: string | null;
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
                    wake_time: string | null;
                };
                Insert: {
                    activity_score?: number | null;
                    bedtime?: string | null;
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
                    wake_time?: string | null;
                };
                Update: {
                    activity_score?: number | null;
                    bedtime?: string | null;
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
                    wake_time?: string | null;
                };
                Relationships: [];
            };
            profiles: {
                Row: {
                    activity_level: string;
                    age: number;
                    avatar_url: string | null;
                    created_at: string | null;
                    current_weight: number;
                    display_name: string | null;
                    gender: string | null;
                    goal: string;
                    goal_weight: number | null;
                    height: number;
                    id: string;
                    onboarding_completed: boolean | null;
                    primary_goal: string | null;
                    renpho_last_sync: string | null;
                    renpho_token: string | null;
                    renpho_user_id: string | null;
                    step_goal: number | null;
                    target_calories: number;
                    target_carbs: number;
                    target_fat: number;
                    target_fiber: number;
                    target_protein: number;
                    target_weight: number;
                    training_day_calories_bonus: number;
                    training_day_carbs: number;
                    training_days_per_week: number | null;
                    updated_at: string | null;
                    user_id: string;
                };
                Insert: {
                    activity_level?: string;
                    age?: number;
                    avatar_url?: string | null;
                    created_at?: string | null;
                    current_weight?: number;
                    display_name?: string | null;
                    gender?: string | null;
                    goal?: string;
                    goal_weight?: number | null;
                    height?: number;
                    id?: string;
                    onboarding_completed?: boolean | null;
                    primary_goal?: string | null;
                    renpho_last_sync?: string | null;
                    renpho_token?: string | null;
                    renpho_user_id?: string | null;
                    step_goal?: number | null;
                    target_calories?: number;
                    target_carbs?: number;
                    target_fat?: number;
                    target_fiber?: number;
                    target_protein?: number;
                    target_weight?: number;
                    training_day_calories_bonus?: number;
                    training_day_carbs?: number;
                    training_days_per_week?: number | null;
                    updated_at?: string | null;
                    user_id: string;
                };
                Update: {
                    activity_level?: string;
                    age?: number;
                    avatar_url?: string | null;
                    created_at?: string | null;
                    current_weight?: number;
                    display_name?: string | null;
                    gender?: string | null;
                    goal?: string;
                    goal_weight?: number | null;
                    height?: number;
                    id?: string;
                    onboarding_completed?: boolean | null;
                    primary_goal?: string | null;
                    renpho_last_sync?: string | null;
                    renpho_token?: string | null;
                    renpho_user_id?: string | null;
                    step_goal?: number | null;
                    target_calories?: number;
                    target_carbs?: number;
                    target_fat?: number;
                    target_fiber?: number;
                    target_protein?: number;
                    target_weight?: number;
                    training_day_calories_bonus?: number;
                    training_day_carbs?: number;
                    training_days_per_week?: number | null;
                    updated_at?: string | null;
                    user_id?: string;
                };
                Relationships: [];
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
                    steps?: number;
                    user_id: string;
                };
                Update: {
                    created_at?: string | null;
                    date?: string;
                    id?: string;
                    steps?: number;
                    user_id?: string;
                };
                Relationships: [];
            };
            water_log: {
                Row: {
                    created_at: string | null;
                    date: string;
                    glasses: number;
                    id: string;
                    ml: number;
                    updated_at: string | null;
                    user_id: string;
                };
                Insert: {
                    created_at?: string | null;
                    date: string;
                    glasses?: number;
                    id?: string;
                    ml?: number;
                    updated_at?: string | null;
                    user_id: string;
                };
                Update: {
                    created_at?: string | null;
                    date?: string;
                    glasses?: number;
                    id?: string;
                    ml?: number;
                    updated_at?: string | null;
                    user_id?: string;
                };
                Relationships: [];
            };
            weekly_plan: {
                Row: {
                    created_at: string | null;
                    day_of_week: number;
                    id: string;
                    intensity: string | null;
                    updated_at: string | null;
                    user_id: string;
                    workout_name: string | null;
                    workout_type: string;
                };
                Insert: {
                    created_at?: string | null;
                    day_of_week: number;
                    id?: string;
                    intensity?: string | null;
                    updated_at?: string | null;
                    user_id: string;
                    workout_name?: string | null;
                    workout_type: string;
                };
                Update: {
                    created_at?: string | null;
                    day_of_week?: number;
                    id?: string;
                    intensity?: string | null;
                    updated_at?: string | null;
                    user_id?: string;
                    workout_name?: string | null;
                    workout_type?: string;
                };
                Relationships: [];
            };
            weight_history: {
                Row: {
                    created_at: string | null;
                    date: string;
                    id: string;
                    weight: number;
                    user_id: string;
                };
                Insert: {
                    created_at?: string | null;
                    date: string;
                    id?: string;
                    weight: number;
                    user_id: string;
                };
                Update: {
                    created_at?: string | null;
                    date?: string;
                    id?: string;
                    weight?: number;
                    user_id?: string;
                };
                Relationships: [];
            };
            workouts: {
                Row: {
                    calories: number;
                    created_at: string | null;
                    date: string;
                    duration: number;
                    exercises: Json;
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
                    exercises?: Json;
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
                    exercises?: Json;
                    id?: string;
                    name?: string;
                    notes?: string | null;
                    type?: string;
                    updated_at?: string | null;
                    user_id?: string;
                    volume?: number | null;
                };
                Relationships: [];
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

type PublicSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
    PublicTableNameOrOptions extends keyof (Database['public']['Tables'] &
        Database['public']['Views']),
> = (Database['public']['Tables'] &
    Database['public']['Views'])[PublicTableNameOrOptions] extends {
    Row: infer R;
}
    ? R
    : never;

export type TablesInsert<
    PublicTableNameOrOptions extends keyof Database['public']['Tables'],
> = Database['public']['Tables'][PublicTableNameOrOptions] extends {
    Insert: infer I;
}
    ? I
    : never;

export type TablesUpdate<
    PublicTableNameOrOptions extends keyof Database['public']['Tables'],
> = Database['public']['Tables'][PublicTableNameOrOptions] extends {
    Update: infer U;
}
    ? U
    : never;

export type Enums<
    PublicEnumNameOrOptions extends keyof Database['public']['Enums'],
> = Database['public']['Enums'][PublicEnumNameOrOptions];

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
        keyof Database['public']['CompositeTypes'],
> = Database['public']['CompositeTypes'][PublicCompositeTypeNameOrOptions];
