# Quick Start Guide: Weekly Report Fixes + AI Meal Prep

## ✅ Implementation Complete

Both FASE 1 (Weekly Report fixes) and FASE 2B (AI Meal Prep Generator) are fully implemented and ready to test.

---

## 🚀 How to Test

### 1. Weekly Report Fixes (FASE 1)

**Test the date range fix:**
```bash
# Open the app on any day except Monday
# Navigate to Weekly Report
# Expected: Should show data for Mon-Sun (full week), not just up to today
```

**Test avgDeficit accuracy:**
```bash
# Add some days with <500 calories
# Check Weekly Report
# Expected: Those days are now included in the average (not ignored)
```

**Test 0% rendering:**
```bash
# If you have 0% progress to goal
# Expected: Should display "0% meta" (not blank)
```

---

### 2. AI Meal Prep Generator (FASE 2B)

**Navigate to Meal Prep:**
```bash
# In your app navigation, go to Meal Prep Planning
# You should see a new prominent button: "Generar Plan Semanal con IA"
```

**Generate a plan:**
```bash
1. Click "Generar Plan Semanal con IA"
2. Modal opens showing:
   - Week range (e.g., "9 Feb - 15 Feb")
   - Your goals (calories, protein, goal type)
   - Workouts for this week (if any)
3. Click "Generar Plan"
4. Wait ~30 seconds (loading spinner with progress text)
5. Success! 28 meals are now in your calendar
```

**Verify the plan:**
```bash
# Check WeeklyCalendar tab
# Each day (Mon-Sun) should have 4 meal types:
#   - Breakfast
#   - Lunch
#   - Snack
#   - Dinner
```

**Check grocery list:**
```bash
# Switch to "Lista de Compras" tab
# Should auto-generate from the 28 meals
# Export as .txt file
```

---

## 🔧 Required Setup

### 1. Database Migration (If Not Already Run)

The `meal_prep_plan` table should already exist (created in previous FASE 2B implementation). Verify it exists:

```sql
-- In Supabase SQL Editor
SELECT * FROM meal_prep_plan LIMIT 1;
```

If it doesn't exist, run the migration:
```sql
-- See sql/meal_prep_plan_migration.sql
```

---

### 2. Environment Variables

Ensure you have:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

### 3. API Route

Ensure the Vercel API route is deployed:
```
api/get-weekly-stats.ts
```

Test it:
```bash
curl "https://your-app.vercel.app/api/get-weekly-stats?userId=your_user_id"
```

---

## 📱 User Flow: Generate Weekly Plan

```
┌─────────────────────────────────┐
│  Meal Prep View                 │
│  ┌───────────────────────────┐  │
│  │ [Generate Weekly Plan] 🪄 │  │ ← Click this
│  └───────────────────────────┘  │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│  Modal: Generate Weekly Plan   │
│  ────────────────────────────── │
│  📅 Week: 9-15 Feb             │
│  🎯 Goals: 2200 kcal, 180g prot│
│  💪 Workouts this week:         │
│     - Monday: Gym (high)        │
│     - Wednesday: Gym (moderate) │
│  ⏱️  Estimated time: ~30 sec    │
│                                 │
│  [Cancel]  [Generate Plan 🚀]  │ ← Click Generate
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│  Loading... (~30 seconds)       │
│  🔄 Generando plan...           │
│  ────────────────────────────── │
│  Progress:                      │
│  - Cargando perfil de usuario  │
│  - Analizando comidas favoritas│
│  - Cargando entrenamientos     │
│  - Generando plan con IA...    │
│  - Guardando comidas...         │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│  ✅ Plan Generated!             │
│  28 meals saved to calendar     │
│  ────────────────────────────── │
│  Weekly Calendar now shows:     │
│  📆 Mon: B/L/S/D                │
│  📆 Tue: B/L/S/D                │
│  📆 Wed: B/L/S/D                │
│  ... (7 days total)             │
└─────────────────────────────────┘
```

---

## 🧪 Testing Scenarios

### Scenario 1: First-time user
```
1. No workouts logged yet
2. No food history
3. Generate plan
Expected: Should still work, AI generates based on default goals
```

### Scenario 2: Active user with workouts
```
1. User has 3 gym sessions this week
2. Has favorite foods from past 30 days
3. Generate plan
Expected: Training days have more carbs/protein, favorite foods appear
```

### Scenario 3: Network failure
```
1. Disconnect Wi-Fi during generation
2. Should retry 3 times automatically
3. If all fail, show error with retry button
```

### Scenario 4: Language switching
```
1. Generate plan in Spanish
2. Switch to English
3. All UI updates, prompts use English
```

---

## 🐛 Troubleshooting

### Issue: Modal doesn't open
**Check:**
- Console for errors
- Ensure `userId` prop is passed to MealPrepView
- Verify button is visible (not hidden by CSS)

### Issue: Generation fails immediately
**Check:**
- Gemini API key is valid (`VITE_GEMINI_API_KEY`)
- Profile exists for user (`profiles` table)
- Console shows detailed error message

### Issue: Generation takes >60 seconds
**Check:**
- Network speed (AI call to Gemini)
- Gemini API rate limits
- Consider using smaller meal counts (reduce to 21 meals = 3 meals/day)

### Issue: Meals don't appear after generation
**Check:**
- `meal_prep_plan` table exists
- RLS policies are enabled
- `fetchWeekPlan()` is called after success
- User is authenticated

### Issue: Grocery list is empty
**Check:**
- `weekPlan` has data (console.log it)
- Ingredients are in `planned_items` JSONB field
- Category matching logic works

---

## 📊 Expected Results

### Weekly Report (FASE 1)
- ✅ Shows full Mon-Sun data (not partial)
- ✅ avgDeficit includes all days (not just >500 kcal)
- ✅ Renders 0% progress correctly
- ✅ Safe type handling (no crashes on null protein)
- ✅ Auto-retries on network failure (3x with backoff)

### AI Meal Prep (FASE 2B)
- ✅ 28 meals generated (7 days × 4 types)
- ✅ Macros sum to ~target per day (±5%)
- ✅ Training days have more carbs/protein
- ✅ Favorite foods appear in plan
- ✅ No meal repeats >2x per week
- ✅ Argentine ingredients (Carrefour/Coto)
- ✅ Grocery list auto-generates
- ✅ Dual language support (ES/EN)

---

## 📝 Key Files Modified

### Backend
- `api/get-weekly-stats.ts` (6 bug fixes)

### Frontend - Hooks
- `src/hooks/useWeeklyReport.tsx` (retry logic + types)
- `src/hooks/useGenerateWeeklyMealPlan.tsx` (NEW - 268 lines)

### Frontend - Components
- `src/components/Dashboard/WeeklyReportCard.tsx` (0% fix)
- `src/components/MealPrep/GenerateWeeklyPlanModal.tsx` (NEW - 245 lines)
- `src/components/MealPrep/MealPrepView.tsx` (integration)

### Services
- `src/services/ai/mealService.ts` (+255 lines for weekly gen)

### Types
- `src/types/domain.ts` (+71 lines)

### i18n
- `src/i18n/locales/es.json` (+10 keys)
- `src/i18n/locales/en.json` (+10 keys)

---

## 🎯 Next Steps (Optional)

1. **Test in Production:** Deploy to Vercel, test with real users
2. **Monitor Costs:** Track Gemini API usage (Flash model is cheap ~$0.01/gen)
3. **Gather Feedback:** Ask users if macros are accurate, meals are practical
4. **Iterate:** Add regenerate specific days, save preferences, etc.

---

## 📞 Support

If you encounter issues:

1. Check console logs (filter by component name, e.g., `[useGenerateWeeklyMealPlan]`)
2. Verify all environment variables are set
3. Check Supabase logs for database errors
4. Review `IMPLEMENTATION_SUMMARY.md` for detailed architecture

---

**Happy Testing! 🚀**
