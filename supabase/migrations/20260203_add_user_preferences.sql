ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS unit_system TEXT NOT NULL DEFAULT 'metric'
    CHECK (unit_system IN ('metric', 'imperial')),
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'es'
    CHECK (language IN ('es', 'en'));

CREATE INDEX IF NOT EXISTS idx_profiles_unit_system ON profiles(unit_system);
CREATE INDEX IF NOT EXISTS idx_profiles_language ON profiles(language);
