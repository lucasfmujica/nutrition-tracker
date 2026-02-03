-- Migration for food_log (formerly food_logs in prompt, corrected to actual table name)
-- FASE 1: Agregar columna temporal
ALTER TABLE food_log ADD COLUMN IF NOT EXISTS meal_type_new TEXT;

-- FASE 2: Mapear español -> inglés
UPDATE food_log SET meal_type_new =
  CASE meal
    WHEN 'Desayuno' THEN 'breakfast'
    WHEN 'Almuerzo' THEN 'lunch'
    WHEN 'Merienda' THEN 'snack'
    WHEN 'Cena' THEN 'dinner'
    WHEN 'Snack' THEN 'other'
    WHEN 'Pre-entreno' THEN 'preworkout'
    WHEN 'Post-entreno' THEN 'postworkout'
    ELSE 'other'
  END;

-- FASE 3: Verificar migración (Safety check block)
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count FROM food_log WHERE meal_type_new IS NULL;
    IF null_count > 0 THEN
        RAISE EXCEPTION 'Found NULL values in food_log.meal_type_new during migration';
    END IF;
END $$;

-- FASE 4: Drop old, rename new
ALTER TABLE food_log DROP COLUMN meal;
ALTER TABLE food_log RENAME COLUMN meal_type_new TO meal;

-- FASE 5: Constraint
ALTER TABLE food_log
  ADD CONSTRAINT meal_type_check
  CHECK (meal IN ('breakfast', 'lunch', 'snack', 'dinner', 'other', 'preworkout', 'postworkout'));


-- Repetir para meal_templates
-- FASE 1: Agregar columna temporal
ALTER TABLE meal_templates ADD COLUMN IF NOT EXISTS meal_type_new TEXT;

-- FASE 2: Mapear español -> inglés
UPDATE meal_templates SET meal_type_new =
  CASE meal
    WHEN 'Desayuno' THEN 'breakfast'
    WHEN 'Almuerzo' THEN 'lunch'
    WHEN 'Merienda' THEN 'snack'
    WHEN 'Cena' THEN 'dinner'
    WHEN 'Snack' THEN 'other'
    WHEN 'Pre-entreno' THEN 'preworkout'
    WHEN 'Post-entreno' THEN 'postworkout'
    ELSE 'other'
  END;

-- FASE 3: Verificar migración
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count FROM meal_templates WHERE meal_type_new IS NULL;
    IF null_count > 0 THEN
        RAISE EXCEPTION 'Found NULL values in meal_templates.meal_type_new during migration';
    END IF;
END $$;

-- FASE 4: Drop old, rename new
ALTER TABLE meal_templates DROP COLUMN meal;
ALTER TABLE meal_templates RENAME COLUMN meal_type_new TO meal;

-- FASE 5: Constraint
ALTER TABLE meal_templates
  ADD CONSTRAINT meal_type_templates_check
  CHECK (meal IN ('breakfast', 'lunch', 'snack', 'dinner', 'other', 'preworkout', 'postworkout'));
