<template>
  <div class="ion-margin-bottom">
    <swiper v-if="transformedSliders.length > 0" ref="mySwiper" :pagination="true" :modules="modules"
      :autoplay="autoplayOptions" slides-per-view="1" loop :onSwiper="onSwiper">
      <swiper-slide v-for="slider in transformedSliders.slice(0, 10)" :key="slider.imageUrl">
        <div v-if="slider.hasWebsiteLink" @click="openUrl(slider.websiteUrl)" style="cursor: pointer;">
          <img :src="slider.imageUrl" alt="">
        </div>
        <img v-else :src="slider.imageUrl" alt="">
      </swiper-slide>
    </swiper>
    <div v-else class="skeleton-container">
      <ion-skeleton-text :animated="true" class="skeleton-slider"></ion-skeleton-text>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { IonSkeletonText } from '@ionic/vue';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import apiSliders from '../axios/apiSliders';
import { useSliderDetails } from '../composables/useSliderDetails';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

const sliders = ref([]);
const { transformAllSliders } = useSliderDetails();

const transformedSliders = computed(() => {
  return transformAllSliders(sliders.value);
});

const modules = [Autoplay, Pagination];
const autoplayOptions = {
  delay: 3000,
  disableOnInteraction: false,
};

const mySwiper = ref(null);

const onSwiper = (swiperInstance) => {
  mySwiper.value = swiperInstance;
  swiperInstance.autoplay.start();
};

const fetchSliders = async () => {
  try {
    const response = await apiSliders.getSliders();
    if (response?.data && Array.isArray(response.data)) {
      sliders.value = response.data;
    }
  } catch (err) {
    // Error handling removed
  }
};

const isSliderModalOpen = ref(false);

const openUrl = async (url) => {
  if (Capacitor.getPlatform() === 'android') {
    isSliderModalOpen.value = true;
  } else {
    await Browser.open({
      url,
      presentationStyle: 'popover'
    });
  }
};

onMounted(async () => {
  await fetchSliders();
});
</script>

<style scoped>
.slider-card {
  width: 100%;
}

.skeleton-container {
  width: 100%;
  height: 170px;
  padding: 0 16px;
}

.skeleton-slider {
  width: 100%;
  height: 170px;
  --border-radius: 0;
}
</style>