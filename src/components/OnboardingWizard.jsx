import { useState, useEffect, useCallback } from 'react';

/**
 * Onboarding Wizard for new users
 * Collects: weight, goal weight, height, age, calorie/macro goals, training days
 */
export function OnboardingWizard({ onComplete, userEmail }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1: Physical stats
    currentWeight: '',
    goalWeight: '',
    height: '',
    age: '',
    gender: 'male',

    // Step 2: Goals
    calorieGoal: '',
    proteinGoal: '',
    carbsGoal: '',
    fatGoal: '',

    // Step 3: Training
    trainingDaysPerWeek: 4,
    primaryGoal: 'maintain', // lose, maintain, gain
    activityLevel: 'moderate', // sedentary, light, moderate, active, very_active
  });

  const totalSteps = 3;

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Calculate suggested macros based on stats - using useCallback to have stable reference
  const calculateMacros = useCallback((data) => {
    const weight = parseFloat(data.currentWeight) || 70;
    const height = parseFloat(data.height) || 170;
    const age = parseFloat(data.age) || 30;
    const isMale = data.gender === 'male';

    // Mifflin-St Jeor equation for BMR
    let bmr;
    if (isMale) {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Activity multiplier
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };

    const tdee = bmr * (activityMultipliers[data.activityLevel] || 1.55);

    // Adjust for goal
    let calories;
    if (data.primaryGoal === 'lose') {
      calories = tdee - 500; // 500 kcal deficit
    } else if (data.primaryGoal === 'gain') {
      calories = tdee + 300; // 300 kcal surplus
    } else {
      calories = tdee;
    }

    // Macro split: 30% protein, 40% carbs, 30% fat
    const protein = Math.round((calories * 0.30) / 4); // 4 kcal per gram
    const carbs = Math.round((calories * 0.40) / 4);
    const fat = Math.round((calories * 0.30) / 9); // 9 kcal per gram

    return {
      calories: Math.round(calories),
      protein,
      carbs,
      fat
    };
  }, []);

  // Auto-recalculate when relevant fields change (step 2 dependencies)
  useEffect(() => {
    // Only auto-calculate on step 2 and when we have basic data
    if (step === 2 && formData.currentWeight && formData.height && formData.age) {
      const suggested = calculateMacros(formData);
      setFormData(prev => ({
        ...prev,
        calorieGoal: suggested.calories.toString(),
        proteinGoal: suggested.protein.toString(),
        carbsGoal: suggested.carbs.toString(),
        fatGoal: suggested.fat.toString()
      }));
    }
  }, [step, formData.currentWeight, formData.height, formData.age, formData.gender, formData.activityLevel, formData.primaryGoal, calculateMacros]);

  const handleAutoCalculate = () => {
    const suggested = calculateMacros(formData);
    setFormData(prev => ({
      ...prev,
      calorieGoal: suggested.calories.toString(),
      proteinGoal: suggested.protein.toString(),
      carbsGoal: suggested.carbs.toString(),
      fatGoal: suggested.fat.toString()
    }));
  };

  const handleNext = () => {
    // The useEffect will auto-calculate macros when entering step 2
    setStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onComplete({
        current_weight: parseFloat(formData.currentWeight) || null,
        goal_weight: parseFloat(formData.goalWeight) || null,
        height: parseFloat(formData.height) || null,
        age: parseInt(formData.age) || null,
        gender: formData.gender,
        calorie_goal: parseInt(formData.calorieGoal) || 2200,
        protein_goal: parseInt(formData.proteinGoal) || 150,
        carbs_goal: parseInt(formData.carbsGoal) || 220,
        fat_goal: parseInt(formData.fatGoal) || 73,
        training_days_per_week: formData.trainingDaysPerWeek,
        primary_goal: formData.primaryGoal,
        activity_level: formData.activityLevel,
        onboarding_completed: true
      });
    } catch (err) {
      console.error('Error saving onboarding:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 1) {
      return formData.currentWeight && formData.height && formData.age;
    }
    if (step === 2) {
      return formData.calorieGoal;
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center p-4">
      {/* Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; }
      `}</style>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <span className="text-2xl">💪</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">¡Bienvenido a LukenFit!</h1>
          <p className="text-gray-400">Configuremos tu perfil en 3 pasos</p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full transition-all ${
                s <= step ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl">

          {/* Step 1: Physical Stats */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="text-center mb-6">
                <span className="text-3xl mb-2 block">📊</span>
                <h2 className="text-xl font-bold text-white">Tus datos físicos</h2>
                <p className="text-sm text-gray-400 mt-1">Para calcular tus metas personalizadas</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Peso actual (kg) *</label>
                  <input
                    type="number"
                    value={formData.currentWeight}
                    onChange={(e) => updateField('currentWeight', e.target.value)}
                    placeholder="75"
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white text-center text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Peso objetivo (kg)</label>
                  <input
                    type="number"
                    value={formData.goalWeight}
                    onChange={(e) => updateField('goalWeight', e.target.value)}
                    placeholder="70"
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white text-center text-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Altura (cm) *</label>
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) => updateField('height', e.target.value)}
                    placeholder="175"
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white text-center text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Edad *</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => updateField('age', e.target.value)}
                    placeholder="27"
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white text-center text-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Género</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => updateField('gender', 'male')}
                    className={`py-3 rounded-xl font-medium transition-all ${
                      formData.gender === 'male'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
                    }`}
                  >
                    👨 Masculino
                  </button>
                  <button
                    onClick={() => updateField('gender', 'female')}
                    className={`py-3 rounded-xl font-medium transition-all ${
                      formData.gender === 'female'
                        ? 'bg-pink-600 text-white'
                        : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
                    }`}
                  >
                    👩 Femenino
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Goals */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center mb-6">
                <span className="text-3xl mb-2 block">🎯</span>
                <h2 className="text-xl font-bold text-white">Tus metas nutricionales</h2>
                <p className="text-sm text-gray-400 mt-1">Calculadas automáticamente según tus datos</p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Objetivo principal</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'lose', label: '⬇️ Bajar', color: 'green' },
                    { value: 'maintain', label: '➡️ Mantener', color: 'blue' },
                    { value: 'gain', label: '⬆️ Subir', color: 'orange' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => updateField('primaryGoal', opt.value)}
                      className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                        formData.primaryGoal === opt.value
                          ? opt.color === 'green' ? 'bg-green-600 text-white'
                          : opt.color === 'orange' ? 'bg-orange-600 text-white'
                          : 'bg-blue-600 text-white'
                          : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Nivel de actividad</label>
                <select
                  value={formData.activityLevel}
                  onChange={(e) => updateField('activityLevel', e.target.value)}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white"
                >
                  <option value="sedentary">Sedentario (poco ejercicio)</option>
                  <option value="light">Ligero (1-2 días/semana)</option>
                  <option value="moderate">Moderado (3-4 días/semana)</option>
                  <option value="active">Activo (5-6 días/semana)</option>
                  <option value="very_active">Muy activo (todos los días)</option>
                </select>
              </div>

              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-400">Tus metas diarias</span>
                  <button
                    onClick={handleAutoCalculate}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    🔄 Recalcular
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <input
                      type="number"
                      value={formData.calorieGoal}
                      onChange={(e) => updateField('calorieGoal', e.target.value)}
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-2 py-2 text-white text-center text-lg font-bold"
                    />
                    <span className="text-xs text-gray-500">kcal</span>
                  </div>
                  <div>
                    <input
                      type="number"
                      value={formData.proteinGoal}
                      onChange={(e) => updateField('proteinGoal', e.target.value)}
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-2 py-2 text-white text-center text-lg font-bold"
                    />
                    <span className="text-xs text-gray-500">prot (g)</span>
                  </div>
                  <div>
                    <input
                      type="number"
                      value={formData.carbsGoal}
                      onChange={(e) => updateField('carbsGoal', e.target.value)}
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-2 py-2 text-white text-center text-lg font-bold"
                    />
                    <span className="text-xs text-gray-500">carbs (g)</span>
                  </div>
                  <div>
                    <input
                      type="number"
                      value={formData.fatGoal}
                      onChange={(e) => updateField('fatGoal', e.target.value)}
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-2 py-2 text-white text-center text-lg font-bold"
                    />
                    <span className="text-xs text-gray-500">fat (g)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Training */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="text-center mb-6">
                <span className="text-3xl mb-2 block">🏋️</span>
                <h2 className="text-xl font-bold text-white">Tu rutina de entreno</h2>
                <p className="text-sm text-gray-400 mt-1">Para trackear tu progreso</p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-3">¿Cuántos días entrenas por semana?</label>
                <div className="flex justify-between gap-1">
                  {[1, 2, 3, 4, 5, 6, 7].map(day => (
                    <button
                      key={day}
                      onClick={() => updateField('trainingDaysPerWeek', day)}
                      className={`w-10 h-10 rounded-xl font-bold transition-all ${
                        formData.trainingDaysPerWeek === day
                          ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white'
                          : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="mt-6 p-4 bg-gray-700/30 rounded-xl">
                <h3 className="font-semibold text-white mb-3">📋 Resumen de tu perfil</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-400">Peso actual:</div>
                  <div className="text-white font-medium">{formData.currentWeight || '-'} kg</div>
                  <div className="text-gray-400">Objetivo:</div>
                  <div className="text-white font-medium">{formData.goalWeight || formData.currentWeight || '-'} kg</div>
                  <div className="text-gray-400">Calorías diarias:</div>
                  <div className="text-white font-medium">{formData.calorieGoal || '-'} kcal</div>
                  <div className="text-gray-400">Proteína:</div>
                  <div className="text-white font-medium">{formData.proteinGoal || '-'}g</div>
                  <div className="text-gray-400">Entrenos/semana:</div>
                  <div className="text-white font-medium">{formData.trainingDaysPerWeek} días</div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex-1 py-3 rounded-xl font-medium bg-gray-700 hover:bg-gray-600 text-white transition-colors"
              >
                ← Atrás
              </button>
            )}
            {step < totalSteps ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                  canProceed()
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                Siguiente →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white transition-all"
              >
                {isSubmitting ? '⏳ Guardando...' : '✓ Comenzar'}
              </button>
            )}
          </div>
        </div>

        {/* Skip option */}
        <button
          onClick={() => onComplete({ onboarding_completed: true })}
          className="w-full mt-4 py-2 text-gray-500 hover:text-gray-400 text-sm transition-colors"
        >
          Omitir por ahora →
        </button>
      </div>
    </div>
  );
}
