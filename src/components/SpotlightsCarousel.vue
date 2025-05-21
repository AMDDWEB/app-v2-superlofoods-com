<template>
  <div class="ion-margin-bottom">
    <ion-list lines="none" v-if="spotlights.length > 0">
      <ion-item>
        <ion-text>
          <h3 class="app-list-heading">Spotlight Specials</h3>
          <p class="app-list-subheading">Don't miss out on this week's top picks.</p>
        </ion-text>
      </ion-item>
    </ion-list>

    <div v-if="!loading">
      <swiper v-if="spotlights.length > 0" @swiper="onSwiper" slides-per-view="1.5" loop>
        <swiper-slide v-for="(item, index) in spotlights.slice(0, 10)" :key="index">
          <div class="spotlight-card" :style="{ backgroundImage: 'url(' + item.image_url + ')' }">
            <div class="overlay"></div>
            <h3>{{ item.price }}</h3>
            <p>{{ item.description }}</p>
          </div>
        </swiper-slide>
      </swiper>
      <!-- <div v-else class="no-items-container">
        <div class="no-items-card">
          <div class="overlay"></div>
          <h3>No Spotlight Specials Available</h3>
          <p>Check back later for new spotlight specials.</p>
        </div>
      </div> -->
    </div>
    <div v-else class="skeleton-container">
      <ion-skeleton-text :animated="true" class="skeleton-spotlight"></ion-skeleton-text>
      <ion-skeleton-text :animated="true" class="skeleton-spotlight"></ion-skeleton-text>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import 'swiper/css';
import apiSpotlights from '../axios/apiSpotlights';
import { useSpotlightDetails } from '../composables/useSpotlightDetails';

const spotlights = ref([]);
const loading = ref(true);
const { transformAllSpotlights } = useSpotlightDetails();

const fetchSpotlights = async () => {
  loading.value = true;
  try {
    const response = await apiSpotlights.getSpotlights();
    const transformedData = transformAllSpotlights(response);
    spotlights.value = transformedData;
  } catch (error) {
    spotlights.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchSpotlights();
});

const onSwiper = (swiper) => {
  swiper.effect = 'fade';
};
</script>

<style scoped>
.swiper {
  padding-left: 16px;
  padding-right: 16px;
}

.spotlight-card {
  text-align: left;
  background-size: cover;
  background-position: center;
  border-radius: 8px;
  border-radius: 15px;
  color: white;
  height: 250px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 12px;
  margin-right: 10px;
}

.spotlight-card h3 {
  margin: 0;
  z-index: 10;
  font-size: 24px;
  font-weight: bold;
  text-transform: uppercase;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.spotlight-card p {
  margin: 0;
  z-index: 10;
  font-size: 16px;
  line-height: 1.4;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.3));
  border-radius: 15px;
}

.skeleton-container {
  display: flex;
  overflow-x: scroll;
  padding: 0 16px;
}

.skeleton-spotlight {
  flex: 0 0 auto;
  width: 250px;
  height: 250px;
  margin-right: 10px;
  --border-radius: 15px;
}

.no-items-container {
  padding: 0 4px 0 16px;
}

.no-items-card {
  text-align: center;
  height: 125px;
  position: relative;
  padding: 12px;
  margin-right: 10px;
}

.no-items-card h3 {
  color: var(--ion-color-danger);
  font-size: 20px;
  font-weight: bold;
  z-index: 10;
  position: relative;
  margin-top: 20px;
}

.no-items-card p {
  color: var(--ion-color-medium);
  font-size: 16px;
  z-index: 10;
  position: relative;
  margin-top: 0px;
}

.no-items-card .overlay {
  background: #f7f7f7;
  border: 1px #eaeaea solid;
  vertical-align: middle;
}

.app-list-heading {
  font-weight: bold;
  margin-bottom: 0px;
}

.app-list-subheading {
  margin-top: 0px;
  color: var(--ion-color-medium);
  font-size: 14px;
}
</style>