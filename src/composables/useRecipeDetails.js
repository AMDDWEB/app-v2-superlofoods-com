export const useRecipeDetails = () => {
  const transformRecipe = (recipe) => ({
    id: recipe.slug,
    slug: recipe.slug,
    recipe_url: recipe.source_url || 'Link Unavailable',
    name: recipe.title,
    image_url: recipe.recipe_import_image_url,
    recipe_difficulty_level: '',
    recipe_serving_size: recipe.serving_size,
    recipe_total_cook_time: recipe.cook_time,
    recipe_total_prep_time: recipe.prep_time,
    recipe_total_time: recipe.total_time,
    recipe_source_url: recipe.source_url || '',
    recipe_ingredients: recipe.recipe_ingredients?.map(
      (ingredient) => ({
        name: ingredient.ingredient,
        serving: ingredient.serving,
      })
    ) || [],
    recipe_steps: recipe.recipe_steps?.map(
      (step) => ({
        method: step,
      })
    ) || [],
  });

  return {
    transformRecipe
  };
};