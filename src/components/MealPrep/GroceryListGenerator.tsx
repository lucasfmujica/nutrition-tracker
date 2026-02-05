import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, ShoppingCart } from 'lucide-react';
import { WeekPlan } from '../../hooks/useMealPrepPlan';

interface GroceryListGeneratorProps {
    weekPlan: WeekPlan;
}

type IngredientCount = Record<string, number>;
type CategorizedIngredients = Record<string, IngredientCount>;

/**
 * Categorize ingredient by name (simple keyword matching)
 * In production, this could be enhanced with a database or ML model
 */
const categorizeIngredient = (ingredientName: string): string => {
    const name = ingredientName.toLowerCase();

    // Proteínas
    if (
        name.includes('pollo') ||
        name.includes('chicken') ||
        name.includes('bife') ||
        name.includes('carne') ||
        name.includes('beef') ||
        name.includes('pescado') ||
        name.includes('fish') ||
        name.includes('salmón') ||
        name.includes('salmon') ||
        name.includes('atún') ||
        name.includes('tuna') ||
        name.includes('huevo') ||
        name.includes('egg') ||
        name.includes('camarón') ||
        name.includes('shrimp')
    ) {
        return '🥩 Proteínas';
    }

    // Carbos
    if (
        name.includes('arroz') ||
        name.includes('rice') ||
        name.includes('papa') ||
        name.includes('potato') ||
        name.includes('batata') ||
        name.includes('sweet potato') ||
        name.includes('pasta') ||
        name.includes('pan') ||
        name.includes('bread') ||
        name.includes('avena') ||
        name.includes('oats') ||
        name.includes('quinoa')
    ) {
        return '🍚 Carbohidratos';
    }

    // Verduras
    if (
        name.includes('brócoli') ||
        name.includes('broccoli') ||
        name.includes('espinaca') ||
        name.includes('spinach') ||
        name.includes('lechuga') ||
        name.includes('lettuce') ||
        name.includes('tomate') ||
        name.includes('tomato') ||
        name.includes('zanahoria') ||
        name.includes('carrot') ||
        name.includes('pepino') ||
        name.includes('cucumber') ||
        name.includes('cebolla') ||
        name.includes('onion') ||
        name.includes('pimiento') ||
        name.includes('pepper') ||
        name.includes('verdura') ||
        name.includes('vegetable')
    ) {
        return '🥦 Verduras';
    }

    // Frutas
    if (
        name.includes('manzana') ||
        name.includes('apple') ||
        name.includes('banana') ||
        name.includes('plátano') ||
        name.includes('fresa') ||
        name.includes('strawberry') ||
        name.includes('naranja') ||
        name.includes('orange') ||
        name.includes('fruta') ||
        name.includes('fruit') ||
        name.includes('pera') ||
        name.includes('uva') ||
        name.includes('grape')
    ) {
        return '🍎 Frutas';
    }

    // Lácteos
    if (
        name.includes('leche') ||
        name.includes('milk') ||
        name.includes('yogur') ||
        name.includes('yogurt') ||
        name.includes('queso') ||
        name.includes('cheese') ||
        name.includes('manteca') ||
        name.includes('butter')
    ) {
        return '🥛 Lácteos';
    }

    // Grasas/Aceites
    if (
        name.includes('aceite') ||
        name.includes('oil') ||
        name.includes('palta') ||
        name.includes('avocado') ||
        name.includes('nuez') ||
        name.includes('nut') ||
        name.includes('almendra') ||
        name.includes('almond') ||
        name.includes('maní') ||
        name.includes('peanut')
    ) {
        return '🥑 Grasas Saludables';
    }

    // Condimentos/Otros
    return '🧂 Condimentos y Otros';
};

/**
 * GroceryListGenerator - Generate and export grocery list from week plan
 *
 * Features:
 * - Aggregates all ingredients from week plan
 * - Groups by category (proteins, carbs, vegetables, etc.)
 * - Counts repetitions (e.g., "Chicken (x3)")
 * - Export as .txt file
 *
 * Mobile-Friendly:
 * - Clear typography
 * - Touch-friendly export button
 * - Grouped by emoji categories for quick scanning
 */
export const GroceryListGenerator: React.FC<GroceryListGeneratorProps> = ({ weekPlan }) => {
    const { t } = useTranslation();

    /**
     * Aggregate and categorize all ingredients from week plan
     */
    const groceryList = useMemo(() => {
        const categorized: CategorizedIngredients = {};

        // Aggregate all meals from all days
        Object.values(weekPlan).forEach((dayMeals) => {
            dayMeals.forEach((meal) => {
                meal.planned_items.forEach((item) => {
                    const category = categorizeIngredient(item.name);

                    if (!categorized[category]) {
                        categorized[category] = {};
                    }

                    const ingredientKey = item.name.trim();
                    categorized[category][ingredientKey] =
                        (categorized[category][ingredientKey] || 0) + 1;
                });
            });
        });

        return categorized;
    }, [weekPlan]);

    const totalItems = useMemo(() => {
        return Object.values(groceryList).reduce(
            (sum, category) => sum + Object.keys(category).length,
            0
        );
    }, [groceryList]);

    /**
     * Export grocery list as .txt file
     */
    const handleExport = () => {
        let content = '🛒 LISTA DE COMPRAS - LUKENFIT\n';
        content += '═'.repeat(40) + '\n\n';

        const categories = Object.keys(groceryList).sort();

        categories.forEach((category) => {
            content += `${category}\n`;
            content += '─'.repeat(40) + '\n';

            const items = Object.entries(groceryList[category]).sort(([a], [b]) =>
                a.localeCompare(b)
            );

            items.forEach(([ingredient, count]) => {
                const countSuffix = count > 1 ? ` (x${count})` : '';
                content += `  ☐ ${ingredient}${countSuffix}\n`;
            });

            content += '\n';
        });

        content += '═'.repeat(40) + '\n';
        content += `Total: ${totalItems} ingredientes únicos\n`;
        content += `Generado: ${new Date().toLocaleDateString('es-AR')}\n`;

        // Create blob and download
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `lista-compras-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (totalItems === 0) {
        return (
            <div className="p-6 rounded-2xl bg-background-secondary border border-border text-center">
                <ShoppingCart className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                <p className="text-sm text-text-tertiary font-medium">
                    {t('mealPrep.planFirstMeal')}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header with Export Button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-accent/10">
                        <ShoppingCart className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-text-primary">
                            {t('mealPrep.groceryList')}
                        </h3>
                        <p className="text-xs text-text-tertiary font-medium">
                            {totalItems} {t('mealPrep.uniqueIngredients')}
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent/90 transition-colors"
                >
                    <Download className="w-4 h-4" />
                    {t('mealPrep.export.title')}
                </button>
            </div>

            {/* Categorized Ingredient List */}
            <div className="space-y-4">
                {Object.entries(groceryList)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([category, items]) => (
                        <div
                            key={category}
                            className="p-4 rounded-2xl bg-background-secondary border border-border"
                        >
                            {/* Category Header */}
                            <h4 className="text-sm font-black text-text-secondary uppercase tracking-wider mb-3">
                                {category}
                            </h4>

                            {/* Ingredient Items */}
                            <div className="space-y-2">
                                {Object.entries(items)
                                    .sort(([a], [b]) => a.localeCompare(b))
                                    .map(([ingredient, count]) => (
                                        <div
                                            key={ingredient}
                                            className="flex items-center justify-between py-2 px-3 rounded-xl bg-background hover:bg-background/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-5 h-5 rounded border-2 border-border flex items-center justify-center"></div>
                                                <p className="text-sm font-semibold text-text-primary">
                                                    {ingredient}
                                                </p>
                                            </div>

                                            {count > 1 && (
                                                <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-1 rounded-lg">
                                                    x{count}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
};
