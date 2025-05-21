<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="$router.go(-1)">
            <ion-icon slot="icon-only" color="primary" name="back-button" size="small"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>{{ recipe?.name }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="shareRecipe">
            <ion-icon slot="icon-only" color="primary" name="share" size="small"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="loading" class="app-loading-container">
        <ion-spinner name="crescent" class="app-loading-spinner"></ion-spinner>
      </div>
      <!-- Recipe image and title -->
      <div v-else-if="recipe">
        <div class="recipe-image-container">
          <img :src="recipe?.image_url" :alt="recipe?.name" />
          <div class="recipe-image-overlay"></div>
          <h1 class="recipe-title">{{ recipe?.name }}</h1>
        </div>
      </div>

      <div v-else class="error-message">
        Recipe not found.
      </div>

      <!-- Recipe details/overview -->

      <div>

        <ion-grid>
          <ion-row>
            <ion-col size="6">
              <ion-item color="recipe-servings" class="recipe-overview">
                <ion-icon name="recipe-servings-regular" color="light" size="large" slot="start"></ion-icon>
                <ion-label>

                  <div class="recipe-overview-heading">Servings</div>
                  <div v-if="recipe" class="recipe-overview-subheading">{{ recipe.recipe_serving_size }}</div>
                </ion-label>
              </ion-item>
            </ion-col>
            <ion-col size="6">
              <ion-item color="recipe-prep-time" class="recipe-overview">
                <ion-icon name="recipe-prep-time-regular" color="light" size="large" slot="start"></ion-icon>
                <ion-label>

                  <div class="recipe-overview-heading">Prep Time</div>
                  <div v-if="recipe" class="recipe-overview-subheading">{{ recipe.recipe_total_prep_time }}</div>
                </ion-label>
              </ion-item>
            </ion-col>
          </ion-row>
          <ion-row>
            <ion-col size="6">
              <ion-item color="recipe-cook-time" class="recipe-overview">
                <ion-icon name="recipe-cook-time-regular" color="light" size="large" slot="start"></ion-icon>
                <ion-label>

                  <div class="recipe-overview-heading">Cook Time</div>
                  <div v-if="recipe" class="recipe-overview-subheading">{{ recipe.recipe_total_cook_time }}</div>
                </ion-label>
              </ion-item>
            </ion-col>
            <ion-col size="6">
              <ion-item color="recipe-total-time" class="recipe-overview">
                <ion-icon name="recipe-total-time-regular" color="light" size="large" slot="start"></ion-icon>
                <ion-label>

                  <div class="recipe-overview-heading">Total Time</div>
                  <div v-if="recipe" class="recipe-overview-subheading">{{ recipe.recipe_total_time }}</div>
                </ion-label>
              </ion-item>
            </ion-col>
          </ion-row>
        </ion-grid>

      </div>

      <!-- New section for ingredients -->
      <div>
        <ion-list lines="full">
          <ion-list-header>
            <ion-label>Ingredients</ion-label>
          </ion-list-header>
          <ion-item v-for="(ingredient, index) in recipe?.recipe_ingredients" :key="index">
            <ion-label>
              <span class="recipe-ingredients-start">{{ ingredient.name }}</span>
              <span class="recipe-ingredients-end">{{ ingredient.serving }}</span>
            </ion-label>
          </ion-item>
        </ion-list>
      </div>

      <!-- Method section - only show if there are steps with non-empty methods -->
      <template v-if="recipe?.recipe_steps?.some(step => step.method && step.method.trim() !== '')">
        <div class="recipe-steps">
          <ion-list lines="full">
            <ion-list-header>
              <ion-label>Instructions</ion-label>
            </ion-list-header>
            <ion-item v-for="(step, index) in recipe.recipe_steps" :key="index">
              <ion-label v-if="step.method && step.method.trim() !== ''">
                <span>{{ step.method }}</span>
              </ion-label>
            </ion-item>
          </ion-list>
        </div>
      </template>

      <!-- View More Details button - only show if there's a source URL -->
      <ion-button v-if="recipe?.recipe_source_url" expand="block" color="secondary" class="recipe-button"
        @click="openSourceUrl">
        View More Details
      </ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { Share } from '@capacitor/share';
import { Browser } from '@capacitor/browser';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonIcon, IonSpinner, IonGrid,
  IonRow, IonCol, IonItem, IonLabel, IonList, IonListHeader
} from '@ionic/vue';
import apiRecipes from '../axios/apiRecipes';
import { useRecipeDetails } from '../composables/useRecipeDetails';

const route = useRoute();
const loading = ref(true);
const recipe = ref(null);
const error = ref(null);
const { transformRecipe } = useRecipeDetails();

const fetchRecipe = async (id) => {
  try {
    loading.value = true;
    error.value = null;
    const response = await apiRecipes.getRecipes();
    const recipes = Array.isArray(response) ? response.map(transformRecipe) : [];
    recipe.value = recipes.find((r) => r.id === id);

    if (!recipe.value) {
      error.value = 'Recipe not found';
    }
  } catch (err) {
    error.value = 'Failed to fetch recipe';
  } finally {
    loading.value = false;
  }
};

const shareRecipe = async () => {
  const siteUrl = import.meta.env.VITE_SITE_URL;
  const storeName = import.meta.env.VITE_STORE_NAME;
  if (siteUrl && recipe.value?.id) {
    const fullUrl = `${siteUrl}/recipe/${recipe.value.id}/`;
    try {
      await Share.share({
        title: recipe.value.name || `Check out this recipe from ${storeName}.`,
        text: `Check out this recipe from ${storeName}.`,
        url: fullUrl,
      });
    } catch (error) {
      // Handle error silently or show user feedback
    }
  }
};

const openSourceUrl = async () => {
  if (recipe.value?.recipe_source_url) {
    try {
      await Browser.open({
        url: recipe.value.recipe_source_url,
        presentationStyle: 'popover'
      });
    } catch (error) {
      // Handle error silently or show user feedback
    }
  }
};

onMounted(() => {
  const { id } = route.params;
  fetchRecipe(id);
});
</script>

<style scoped>
.toolbar-icon {
  font-size: 20px !important;
}

.recipe-image-container {
  position: relative;
  width: 100%;
  height: 250px;
  /* Adjust as needed */
  overflow: hidden;
}

.recipe-image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.recipe-image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
}

.recipe-title {
  position: absolute;
  bottom: 10px;
  left: 10px;
  color: #fff;
  font-size: 30px;
  margin: 0;
  z-index: 2;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  width: 65%;
}

.recipe-overview {
  --border-radius: 10px;
  /* box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); */
  text-align: left;
  background-color: transparent !important;
  overflow: hidden;
}

.recipe-overview-heading {
  font-weight: 600;
  font-size: 16px;
}

.recipe-overview-subheading {
  text-transform: capitalize;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap !important;
}

.recipe-ingredients-start {
  font-weight: 500;
  text-transform: capitalize;
  display: inline-block;
  white-space: nowrap;
  /* Prevents wrapping */
  overflow: hidden;
  /* Hides overflow content */
  text-overflow: ellipsis;
  /* Adds ellipsis (...) when content overflows */
  max-width: 20ch;
  /* Limits to approximately 20 characters */
}

.recipe-ingredients-end {
  float: right;
  text-transform: capitalize;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 10ch;
}

.recipe-steps {
  margin-bottom: 36px;
}

.recipe-button {
  margin-bottom: 36px;
  margin-top: 36px;
  margin-right: 0;
  margin-left: 0;
  max-width: 95%;
  margin-left: auto;
	margin-right: auto;
}
</style>
