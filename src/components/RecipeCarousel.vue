<template>
  <div class="ion-margin-bottom">
    <ion-list lines="none">
      <ion-item @click="goToRecipesArchive">
        <ion-text>
          <h3 class="app-list-heading">
            Featured Recipes
            <ion-icon style="font-size: 16px;" name="chevron-right" color="medium"></ion-icon>
          </h3>
          <p class="app-list-subheading">Get inspired by our handpicked recipes.</p>
        </ion-text>
      </ion-item>
    </ion-list>

    <div v-if="recipes.length > 0">
      <swiper @swiper="onSwiper" :slides-per-view="2.5">
        <swiper-slide v-for="(recipe, index) in recipes.slice(0, 10)" :key="recipe.id || index">
          <div class="recipe-card" @click="goToRecipeSingle(recipe.id)">
            <div class="image-container" :style="{ backgroundImage: 'url(' + recipe.image_url + ')' }">
              <div class="overlay"></div>
            </div>
            <h3 class="recipe-title">{{ recipe.name }}</h3>
          </div>
        </swiper-slide>
      </swiper>
    </div>
    <div v-else class="skeleton-container">
      <div class="skeleton-recipe-card" v-for="i in 3" :key="i">
        <ion-skeleton-text :animated="true" class="skeleton-recipe-image"></ion-skeleton-text>
        <ion-skeleton-text :animated="true" class="skeleton-recipe-title"></ion-skeleton-text>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import 'swiper/css';
import { useRouter } from 'vue-router';
import apiRecipes from '../axios/apiRecipes';
import { useRecipeDetails } from '../composables/useRecipeDetails';

const loading = ref(true);
const recipes = ref([]);
const router = useRouter();
const { transformRecipe } = useRecipeDetails();

const fetchRecipes = async () => {
  try {
    loading.value = true;
    const response = await apiRecipes.getRecipes();
    recipes.value = Array.isArray(response)
      ? response
        .filter(recipe => recipe.status === 'publish')
        .map(transformRecipe)
        .slice(0, 10)
      : [];
  } catch (error) {
    recipes.value = [];
  } finally {
    loading.value = false;
  }
};

const goToRecipesArchive = () => {
  router.push('recipes');
};

const goToRecipeSingle = (id) => {
  router.push({ name: 'RecipeDetails', params: { id } });
};

onMounted(() => {
  fetchRecipes();
});

const onSwiper = (swiper) => {
  swiper.effect = 'fade';
};
</script>

<style scoped>
ion-note {
  color: #000;
  font-weight: bold;
}

ion-text {
  font-size: 14px;
}

@media (max-width: 600px) {
  ion-text {
    font-size: 12px;
  }
}

.swiper {
  padding-left: 12px;
  padding-right: 0px;
}

.swiper-slide {
  display: flex;
  flex-direction: column;
  align-items: center;
  /* Center align items */
}

.recipe-card {
  width: 100%;
  margin-right: 0px;
  display: flex;
  flex-direction: column;
  height: auto;
  overflow: hidden;
  padding: 4px;
  box-sizing: border-box;
  cursor: pointer;
  /* Indicate clickable */
}

.image-container {
  width: 100%;
  height: 150px;
  background-size: cover;
  background-position: center;
  border-radius: 4px;
  position: relative;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.0);
  border-radius: 8px;
}

.recipe-title {
  margin-top: 5px;
  font-size: 14px;
  text-align: left;
  /* Center align title */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-wrap: break-word;
  max-height: 2.4em;
  margin-bottom: 0;
}

@media (max-width: 600px) {
  .recipe-title {
    font-size: 13px;
  }
}

.app-list-heading {
  font-weight: bold;
  margin-bottom: 0px;
}

.app-list-subheading {
  margin-top: 0px;
  color: var(--ion-color-medium);
  font-size: 14px;
  line-height: 1.4;
}

.skeleton-container {
  display: flex;
  overflow-x: scroll;
  padding: 0 12px;
}

.skeleton-recipe-card {
  flex: 0 0 auto;
  width: 150px;
  margin-right: 10px;
}

.skeleton-recipe-image {
  width: 100%;
  height: 150px;
  --border-radius: 4px;
}

.skeleton-recipe-title {
  width: 80%;
  height: 20px;
  margin-top: 5px;
}
</style>
