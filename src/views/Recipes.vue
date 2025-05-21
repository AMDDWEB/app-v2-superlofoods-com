<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-img class="app-toolbar-image" :src="logoUrl"></ion-img>
      </ion-toolbar>
      <ion-toolbar>
        <div class="app-search-container">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" class="app-custom-search-icon">
            <path d="M0 486.4C0 500.5 11.5 512 25.6 512L64 512l24 0 8 0 0-8 0-24 0-47.5c0-26.2 15.9-49.7 40.2-59.4l43.2-17.3c7.2-2.9 6.5-13.3-1-15.2c-24.2-6.1-48.3-12.2-72.5-18.2c-5-1.2-9.9 2.6-9.9 7.8l0 21.4c0 3.5-2.4 6.6-5.7 7.8C37.7 377.6 0 427.6 0 486.4zM64 48c0 20.9 13.4 38.7 32 45.3L96 112l0 64c0 70.7 57.3 128 128 128c25 0 48.3-7.1 67.9-19.5c8.4-37.1 29.7-69.4 59-91.7c.7-5.5 1.1-11.1 1.1-16.8l0-64 0-18.7c18.6-6.6 32-24.4 32-45.3c0-26.5-21.5-48-48-48c-14.3 0-27.2 6.3-36 16.3C291.2 6.3 278.3 0 264 0c-16.7 0-31.4 8.5-40 21.5C215.4 8.5 200.7 0 184 0c-14.3 0-27.2 6.3-36 16.3C139.2 6.3 126.3 0 112 0C85.5 0 64 21.5 64 48zm64 384.5l0 47.5 0 24 0 8 8 0 24 0 192 0 70.4 0c14.1 0 25.6-11.5 25.6-25.6c0-2.1-.1-4.3-.1-6.4c-79.5-.1-145.4-58-157.8-134l-142 56.8C136 407.6 128 419.4 128 432.5zM144 160l160 0 0 16c0 44.2-35.8 80-80 80s-80-35.8-80-80l0-16zm48 272c0-8.8 7.2-16 16-16s16 7.2 16 16s-7.2 16-16 16s-16-7.2-16-16zm96 0c0-8.8 7.2-16 16-16s16 7.2 16 16s-7.2 16-16 16s-16-7.2-16-16zm32-112c0 70.7 57.3 128 128 128c26.7 0 51.4-8.2 71.9-22.1l.1-.1 79.1 79.1c9.3 9.4 24.5 9.3 33.9 0s9.4-24.5 0-33.9l-79.1-79.1C567.8 371.4 576 346.7 576 320c0-70.7-57.3-128-128-128s-128 57.3-128 128zm48 0c0-28.6 15.2-55 40-69.3s55.2-14.3 80 0s40 40.7 40 69.3s-15.2 55-40 69.3s-55.2 14.3-80 0s-40-40.7-40-69.3z"/>
          </svg>
          <input
            v-model="searchQuery"
            placeholder="Search recipes..."
            @input="handleSearch"
            class="app-search-input"
          />
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="doRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="recipes-grid">
        <template v-if="loading">
          <div v-for="n in 10" :key="n" class="recipe-card skeleton">
            <ion-skeleton-text animated class="skeleton-image"></ion-skeleton-text>
          </div>
        </template>
        <template v-else>
          <div
            class="recipe-card"
            v-for="(recipe, index) in filteredRecipes"
            :key="recipe.id || index"
            @click="goToRecipeSingle(recipe.id)"
          >
            <div
              class="image-container"
              :style="{ backgroundImage: 'url(' + recipe.image_url + ')' }"
            >
              <div class="overlay"></div>
              <h3>{{ recipe.name }}</h3>
            </div>
          </div>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted, computed, defineComponent } from 'vue';
import { useRouter } from 'vue-router';
import apiRecipes from '../axios/apiRecipes';
import { 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonContent, 
  IonImg, 
  IonRefresher, 
  IonRefresherContent, 
  IonSkeletonText
} from '@ionic/vue';
import { useRecipeDetails } from '../composables/useRecipeDetails';

const loading = ref(true);
const recipes = ref([]);
const router = useRouter();
const searchQuery = ref('');
const logoUrl = ref(import.meta.env.VITE_PRIMARY_LOGO);
const { transformRecipe } = useRecipeDetails();

const fetchRecipes = async (isRefreshing = false) => {
  if (!isRefreshing) {
    loading.value = true;
  }
  try {
    const response = await apiRecipes.getRecipes();
    recipes.value = Array.isArray(response) ? response.map(transformRecipe) : [];
  } catch (error) {
    // Error handling without console.error
    recipes.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchRecipes();
});

const goToRecipeSingle = (id) => {
  router.push({
    name: 'RecipeDetails',
    params: { id },
  });
};

const filteredRecipes = computed(() => {
  if (!searchQuery.value) return recipes.value;
  const query = searchQuery.value.toLowerCase();
  return recipes.value.filter(recipe => 
    recipe.name.toLowerCase().includes(query) ||
    recipe.recipe_ingredients.some(ingredient => 
      ingredient.name.toLowerCase().includes(query)
    )
  );
});

const handleSearch = () => {
  // Filtering is handled by computed property
};

const doRefresh = async (event) => {
  await fetchRecipes(true);
  event.target.complete();
};

defineComponent({ name: 'RecipesPage' });
</script>

<style scoped>
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.recipes-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 10px;
}

.recipe-card {
  width: 100%;
  height: 150px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.recipe-card:hover {
  transform: scale(1.02);
}

.image-container {
  width: 100%;
  height: 150px;
  background-size: cover;
  background-position: center;
  border-radius: 8px;
  position: relative;
  display: flex;
  align-items: flex-end;
  padding: 10px;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 1;
}

.image-container h3 {
  margin: 0;
  color: #f7f7f7;
  font-size: 14px;
  text-align: left;
  width: 100%;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  z-index: 2;
  position: relative;
}

@media (max-width: 600px) {
  .image-container h3 {
    font-size: 16px;
  }
}

.skeleton {
  background: #f7f7f7;
  height: 150px;
  border-radius: 8px;
  overflow: hidden;
}

.skeleton-image {
  width: 100%;
  height: 150px;
  border-radius: 8px;
}

</style>
