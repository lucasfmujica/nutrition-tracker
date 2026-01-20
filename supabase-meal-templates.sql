-- =====================================================
-- MEAL TEMPLATES TABLE
-- Stores favorite foods/meals as reusable templates
-- =====================================================

CREATE TABLE IF NOT EXISTS meal_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  meal TEXT NOT NULL CHECK (meal IN ('Desayuno', 'Almuerzo', 'Merienda', 'Cena', 'Snack', 'Pre-entreno', 'Post-entreno')),
  description TEXT,
  calories INTEGER NOT NULL DEFAULT 0,
  protein DECIMAL(6,2) NOT NULL DEFAULT 0,
  carbs DECIMAL(6,2) NOT NULL DEFAULT 0,
  fat DECIMAL(6,2) NOT NULL DEFAULT 0,
  fiber DECIMAL(6,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name, meal)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_meal_templates_user ON meal_templates(user_id);

-- Enable RLS
ALTER TABLE meal_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own meal templates" ON meal_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal templates" ON meal_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal templates" ON meal_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal templates" ON meal_templates
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_meal_templates_updated_at ON meal_templates;
CREATE TRIGGER update_meal_templates_updated_at
  BEFORE UPDATE ON meal_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
