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
            activity_feed: {
                Row: {
                    activity_type: string;
                    created_at: string | null;
                    id: string;
                    metadata: Json | null;
                    user_id: string;
                };
                Insert: {
                    activity_type: string;
                    created_at?: string | null;
                    id?: string;
                    metadata?: Json | null;
                    user_id: string;
                };
                Update: {
                    activity_type?: string;
                    created_at?: string | null;
                    id?: string;
                    metadata?: Json | null;
                    user_id?: string;
                };
                Relationships: [];
            };
            activity_reactions: {
                Row: {
                    activity_id: string;
                    created_at: string;
                    id: string;
                    reaction_type: string;
                    user_id: string;
                };
                Insert: {
                    activity_id: string;
                    created_at?: string;
                    id?: string;
                    reaction_type?: string;
                    user_id: string;
                };
                Update: {
                    activity_id?: string;
                    created_at?: string;
                    id?: string;
                    reaction_type?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            body_measurements: {
                Row: {
                    biceps_left: number | null;
                    biceps_right: number | null;
                    body_fat_percent: number | null;
                    calf_left: number | null;
                    calf_right: number | null;
                    chest: number | null;
                    created_at: string | null;
                    date: string;
                    forearm_left: number | null;
                    forearm_right: number | null;
                    hips: number | null;
                    id: string;
                    neck: number | null;
                    notes: string | null;
                    shoulders: number | null;
                    thigh_left: number | null;
                    thigh_right: number | null;
                    updated_at: string | null;
                    user_id: string;
                    waist: number | null;
                };
                Insert: {
                    biceps_left?: number | null;
                    biceps_right?: number | null;
                    body_fat_percent?: number | null;
                    calf_left?: number | null;
                    calf_right?: number | null;
                    chest?: number | null;
                    created_at?: string | null;
                    date: string;
                    forearm_left?: number | null;
                    forearm_right?: number | null;
                    hips?: number | null;
                    id?: string;
                    neck?: number | null;
                    notes?: string | null;
                    shoulders?: number | null;
                    thigh_left?: number | null;
                    thigh_right?: number | null;
                    updated_at?: string | null;
                    user_id: string;
                    waist?: number | null;
                };
                Update: Partial<Database['public']['Tables']['body_measurements']['Insert']>;
                Relationships: [];
            };
            challenge_participants: {
                Row: {
                    challenge_id: string;
                    created_at: string;
                    id: string;
                    joined_at: string | null;
                    progress: number;
                    status: string;
                    user_id: string;
                };
                Insert: {
                    challenge_id: string;
                    created_at?: string;
                    id?: string;
                    joined_at?: string | null;
                    progress?: number;
                    status?: string;
                    user_id: string;
                };
                Update: {
                    challenge_id?: string;
                    created_at?: string;
                    id?: string;
                    joined_at?: string | null;
                    progress?: number;
                    status?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'challenge_participants_challenge_id_fkey';
                        columns: ['challenge_id'];
                        isOneToOne: false;
                        referencedRelation: 'challenges';
                        referencedColumns: ['id'];
                    },
                ];
            };
            challenges: {
                Row: {
                    created_at: string;
                    creator_id: string;
                    end_date: string;
                    goal_value: number | null;
                    id: string;
                    metric: string;
                    start_date: string;
                    status: string;
                    title: string;
                };
                Insert: {
                    created_at?: string;
                    creator_id: string;
                    end_date: string;
                    goal_value?: number | null;
                    id?: string;
                    metric: string;
                    start_date: string;
                    status?: string;
                    title: string;
                };
                Update: {
                    created_at?: string;
                    creator_id?: string;
                    end_date?: string;
                    goal_value?: number | null;
                    id?: string;
                    metric?: string;
                    start_date?: string;
                    status?: string;
                    title?: string;
                };
                Relationships: [];
            };
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
                    meal: string | null;
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
                    meal?: string | null;
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
                    calories: number | null;
                    carbs: number | null;
                    created_at: string | null;
                    description: string | null;
                    fat: number | null;
                    fiber: number | null;
                    id: string;
                    items: Json | null;
                    meal: string | null;
                    name: string;
                    protein: number | null;
                    updated_at: string | null;
                    user_id: string;
                };
                Insert: {
                    calories?: number | null;
                    carbs?: number | null;
                    created_at?: string | null;
                    description?: string | null;
                    fat?: number | null;
                    fiber?: number | null;
                    id?: string;
                    items?: Json | null;
                    meal?: string | null;
                    name: string;
                    protein?: number | null;
                    updated_at?: string | null;
                    user_id: string;
                };
                Update: {
                    calories?: number | null;
                    carbs?: number | null;
                    created_at?: string | null;
                    description?: string | null;
                    fat?: number | null;
                    fiber?: number | null;
                    id?: string;
                    items?: Json | null;
                    meal?: string | null;
                    name?: string;
                    protein?: number | null;
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
                    activity_level: string;
                    age: number;
                    avatar_url: string | null;
                    created_at: string | null;
                    current_weight: number;
                    display_name: string | null;
                    friend_code: string | null;
                    gender: string | null;
                    goal: string;
                    goal_weight: number | null;
                    has_oura_ring: boolean | null;
                    height: number;
                    id: string;
                    ios_shortcuts_configured: boolean | null;
                    is_public: boolean | null;
                    language: string;
                    onboarding_completed: boolean | null;
                    oura_personal_token: string | null;
                    primary_goal: string | null;
                    renpho_last_sync: string | null;
                    renpho_token: string | null;
                    renpho_user_id: string | null;
                    safety_net_days: string[] | null;
                    smart_hydration: boolean;
                    target_calories: number;
                    target_carbs: number;
                    target_fat: number;
                    target_fiber: number;
                    target_protein: number;
                    target_weight: number;
                    step_goal: number;
                    steps_auto_sync: boolean;
                    timezone: string;
                    training_day_calories_bonus: number;
                    training_day_carbs: number;
                    training_days_per_week: number | null;
                    tutorial_completed: boolean | null;
                    unit_system: string;
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
                    friend_code?: string | null;
                    gender?: string | null;
                    goal?: string | null;
                    goal_weight?: number | null;
                    has_oura_ring?: boolean | null;
                    height?: number | null;
                    id?: string;
                    ios_shortcuts_configured?: boolean | null;
                    is_public?: boolean | null;
                    language?: string;
                    onboarding_completed?: boolean | null;
                    oura_personal_token?: string | null;
                    primary_goal?: string | null;
                    renpho_last_sync?: string | null;
                    renpho_token?: string | null;
                    renpho_user_id?: string | null;
                    safety_net_days?: string[] | null;
                    smart_hydration?: boolean;
                    target_calories?: number | null;
                    target_carbs?: number | null;
                    target_fat?: number | null;
                    target_fiber?: number | null;
                    target_protein?: number | null;
                    target_weight?: number | null;
                    step_goal?: number | null;
                    steps_auto_sync?: boolean;
                    timezone?: string;
                    training_day_calories_bonus?: number | null;
                    training_day_carbs?: number | null;
                    training_days_per_week?: number | null;
                    tutorial_completed?: boolean | null;
                    unit_system?: string;
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
                    friend_code?: string | null;
                    gender?: string | null;
                    goal?: string | null;
                    goal_weight?: number | null;
                    has_oura_ring?: boolean | null;
                    height?: number | null;
                    id?: string;
                    ios_shortcuts_configured?: boolean | null;
                    is_public?: boolean | null;
                    language?: string;
                    onboarding_completed?: boolean | null;
                    oura_personal_token?: string | null;
                    primary_goal?: string | null;
                    renpho_last_sync?: string | null;
                    renpho_token?: string | null;
                    renpho_user_id?: string | null;
                    safety_net_days?: string[] | null;
                    smart_hydration?: boolean;
                    target_calories?: number | null;
                    target_carbs?: number | null;
                    target_fat?: number | null;
                    target_fiber?: number | null;
                    target_protein?: number | null;
                    target_weight?: number | null;
                    step_goal?: number | null;
                    steps_auto_sync?: boolean;
                    timezone?: string;
                    training_day_calories_bonus?: number | null;
                    training_day_carbs?: number | null;
                    training_days_per_week?: number | null;
                    tutorial_completed?: boolean | null;
                    unit_system?: string;
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
                    source: string;
                    steps: number;
                    updated_at: string | null;
                    user_id: string;
                };
                Insert: {
                    created_at?: string | null;
                    date: string;
                    id?: string;
                    source?: string;
                    steps?: number;
                    updated_at?: string | null;
                    user_id: string;
                };
                Update: {
                    created_at?: string | null;
                    date?: string;
                    id?: string;
                    source?: string;
                    steps?: number;
                    updated_at?: string | null;
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
                    daily_target: number | null;
                    max_temp: number | null;
                    weather_unit: 'C' | 'F' | null;
                    weather_location: string | null;
                    user_id: string;
                };
                Insert: {
                    created_at?: string | null;
                    date: string;
                    glasses?: number;
                    id?: string;
                    ml?: number;
                    daily_target?: number | null;
                    max_temp?: number | null;
                    weather_unit?: 'C' | 'F' | null;
                    weather_location?: string | null;
                    user_id: string;
                };
                Update: {
                    created_at?: string | null;
                    date?: string;
                    glasses?: number;
                    id?: string;
                    ml?: number;
                    daily_target?: number | null;
                    max_temp?: number | null;
                    weather_unit?: 'C' | 'F' | null;
                    weather_location?: string | null;
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
            friendships: {
                Row: {
                    accepted_at: string | null;
                    created_at: string | null;
                    friend_id: string;
                    id: string;
                    status: string;
                    user_id: string;
                };
                Insert: {
                    accepted_at?: string | null;
                    created_at?: string | null;
                    friend_id: string;
                    id?: string;
                    status?: string;
                    user_id: string;
                };
                Update: {
                    accepted_at?: string | null;
                    created_at?: string | null;
                    friend_id?: string;
                    id?: string;
                    status?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            meal_prep_plan: {
                Row: {
                    created_at: string | null;
                    date: string;
                    id: string;
                    is_completed: boolean | null;
                    meal_type: string;
                    notes: string | null;
                    planned_items: Json;
                    template_id: string | null;
                    updated_at: string | null;
                    user_id: string;
                };
                Insert: {
                    created_at?: string | null;
                    date: string;
                    id?: string;
                    is_completed?: boolean | null;
                    meal_type: string;
                    notes?: string | null;
                    planned_items?: Json;
                    template_id?: string | null;
                    updated_at?: string | null;
                    user_id: string;
                };
                Update: {
                    created_at?: string | null;
                    date?: string;
                    id?: string;
                    is_completed?: boolean | null;
                    meal_type?: string;
                    notes?: string | null;
                    planned_items?: Json;
                    template_id?: string | null;
                    updated_at?: string | null;
                    user_id?: string;
                };
                Relationships: [];
            };
            progress_photos: {
                Row: {
                    angle: string | null;
                    created_at: string | null;
                    date: string;
                    id: string;
                    notes: string | null;
                    photo_url: string;
                    thumbnail_url: string | null;
                    updated_at: string | null;
                    user_id: string;
                    weight: number | null;
                };
                Insert: {
                    angle?: string | null;
                    created_at?: string | null;
                    date: string;
                    id?: string;
                    notes?: string | null;
                    photo_url: string;
                    thumbnail_url?: string | null;
                    updated_at?: string | null;
                    user_id: string;
                    weight?: number | null;
                };
                Update: Partial<Database['public']['Tables']['progress_photos']['Insert']>;
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
            weekly_snapshots: {
                Row: {
                    avg_deficit: number | null;
                    consistency_streak: number | null;
                    created_at: string | null;
                    id: string;
                    user_id: string;
                    week_start: string;
                    weight_delta: number | null;
                    workout_count: number | null;
                };
                Insert: {
                    avg_deficit?: number | null;
                    consistency_streak?: number | null;
                    created_at?: string | null;
                    id?: string;
                    user_id: string;
                    week_start: string;
                    weight_delta?: number | null;
                    workout_count?: number | null;
                };
                Update: {
                    avg_deficit?: number | null;
                    consistency_streak?: number | null;
                    created_at?: string | null;
                    id?: string;
                    user_id?: string;
                    week_start?: string;
                    weight_delta?: number | null;
                    workout_count?: number | null;
                };
                Relationships: [];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            find_user_by_friend_code: {
                Args: { p_friend_code: string };
                Returns: {
                    avatar_url: string;
                    display_name: string;
                    friend_code: string;
                    user_id: string;
                }[];
            };
            get_accepted_friends: {
                Args: { p_user_id: string };
                Returns: { friend_user_id: string }[];
            };
            get_activity_reaction_count: {
                Args: { p_activity_id: string };
                Returns: number;
            };
            has_user_reacted: {
                Args: { p_activity_id: string; p_user_id: string };
                Returns: boolean;
            };
            is_challenge_member: {
                Args: { cid: string };
                Returns: boolean;
            };
            migrate_food_log_times: {
                Args: { p_new_timezone: string; p_user_id: string };
                Returns: number;
            };
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;
type PublicSchema = DatabaseWithoutInternals['public'];

export type Tables<
    PublicTableNameOrOptions extends
        | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends PublicTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof (DatabaseWithoutInternals[PublicTableNameOrOptions['schema']]['Tables'] &
              DatabaseWithoutInternals[PublicTableNameOrOptions['schema']]['Views'])
        : never = never,
> = PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? (DatabaseWithoutInternals[PublicTableNameOrOptions['schema']]['Tables'] &
          DatabaseWithoutInternals[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
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
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends PublicTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[PublicTableNameOrOptions['schema']]['Tables']
        : never = never,
> = PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? DatabaseWithoutInternals[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
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
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends PublicTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[PublicTableNameOrOptions['schema']]['Tables']
        : never = never,
> = PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? DatabaseWithoutInternals[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
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
        | { schema: keyof DatabaseWithoutInternals },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
        ? keyof DatabaseWithoutInternals[PublicEnumNameOrOptions['schema']]['Enums']
        : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
    ? DatabaseWithoutInternals[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
    : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
      ? PublicSchema['Enums'][PublicEnumNameOrOptions]
      : never;

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
        | keyof PublicSchema['CompositeTypes']
        | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
        : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof PublicSchema['CompositeTypes']
      ? PublicSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
      : never;

export const Constants = {
    public: {
        Enums: {},
    },
} as const;
