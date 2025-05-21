<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>

        <ion-buttons slot="start">

          <ion-button @click="$router.push('/notifications')" v-if="notificationsAvailable"
            class="ion-padding-end-small">
            <ion-icon color="danger" name="notifications-regular" size="medium"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end">

          <ion-button @click="presentBarcodeModal" v-if="hasAppCardCoupons && loyaltyNumber" class="ion-padding-end">
            <ion-icon color="primary" name="my-barcode-regular" size="medium"></ion-icon>
          </ion-button>

          <ion-button @click="$router.push('/grocery-list')"
            class="ion-padding-end-small">
            <ion-icon color="primary" name="edit-grocery-list-regular" size="medium"></ion-icon>
          </ion-button>
        </ion-buttons>

        <ion-title><ion-img class="app-toolbar-image" :src="logoUrl"></ion-img></ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- Removed ion-refresher -->

      <!-- Display Sliders -->
      <sliderCarousel :sliders="sliderImages" />

      <!-- Weekly ads, rewards and my store buttons -->
      <ion-grid :fixed="true">
        <ion-row>
          <ion-col>
            <ion-button expand="block" size="small" @click="handleWeeklyAdClick"
              :color="hasWeeklyAd ? 'primary' : 'medium'">
              <ion-icon slot="start" name="ads-regular"></ion-icon>
              Weekly Ad
            </ion-button>
          </ion-col>
          <ion-col v-if="hasRewards">
            <ion-button expand="block" size="small" @click="handleRewardsClick" color="primary">
              <ion-icon slot="start" name="rewards-regular"></ion-icon>
              Rewards
            </ion-button>
          </ion-col>
          <ion-col>
            <ion-button expand="block" size="small" @click="handleMyStoreClick"
              :color="selectedLocation ? 'primary' : 'medium'">
              <ion-icon slot="start" name="set-location-regular"></ion-icon>
              {{ selectedLocation ? 'My Store' : 'Set My Store' }}
            </ion-button>
          </ion-col>
        </ion-row>
      </ion-grid>

      <!-- Spotlights Carousel -->
      <SpotlightsCarousel :spotlights="spotlights" />
      <!-- Featured Coupons Carousel -->
      <CouponsCarousel v-if="hasAppCardCoupons || hasMidaxCoupons" :coupons="coupons" />

      <!-- Featured Recipes Carousel -->
      <RecipeCarousel :recipes="recipes" />

      <!-- Location Modal -->
      <SetLocationModal :is-open="isLocationModalOpen" @update:is-open="isLocationModalOpen = $event"
        @location-selected="handleLocationSelected" />

      <!-- Pdf Viewer Modal -->
      <PdfViewerModal :is-open="pdfModalState.isOpen" :pdf-url="pdfModalState.url" :ad-type="pdfModalState.type"
        :start-date="pdfModalState.startDate" @update:is-open="closePdfModal" />
      <BarcodeModal :isOpen="showBarcodeModal" @update:isOpen="showBarcodeModal = $event" />
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted, computed, inject } from 'vue';
import apiSliders from '../axios/apiSliders.js';
import sliderCarousel from '@/components/sliderCarousel.vue';
import apiRecipes from '../axios/apiRecipes.js';
import apiSpotlights from '../axios/apiSpotlights.js';
import apiLocations from '../axios/apiLocations.js'; // Import the API for locations
import RecipeCarousel from '@/components/RecipeCarousel.vue';
import SpotlightsCarousel from '@/components/SpotlightsCarousel.vue';
import SetLocationModal from '@/components/SetLocationModal.vue';
import PdfViewerModal from '@/components/PdfViewerModal.vue';
import CouponsCarousel from '@/components/CouponsCarousel.vue';
import { IonPage, IonHeader, IonToolbar, IonContent, IonButtons, IonButton, IonIcon, IonTitle, IonImg, IonGrid, IonRow, IonCol } from '@ionic/vue';
import { useRouter } from 'vue-router';
import { useSignupModal } from '@/composables/useSignupModal';
import BarcodeModal from '@/components/BarcodeModal.vue';
import apiNotifications from '../axios/apiNotifications.js'; // Import your API for notifactions
import { onIonViewDidEnter, onIonViewWillEnter } from '@ionic/vue';
import { defineComponent } from 'vue';

const showBarcodeModal = ref(false);
const { getLoyaltyNumber, getCardNumber } = useSignupModal();
const loyaltyNumber = ref(getLoyaltyNumber());

const presentBarcodeModal = () => {
  if (loyaltyNumber.value && getCardNumber()) {
    showBarcodeModal.value = true;
  }
};

// Initialize all refs at the top
const sliders = ref([]);
const recipes = ref([]);
const spotlights = ref([]);
const selectedLocation = ref(null);
const logoUrl = ref(import.meta.env.VITE_PRIMARY_LOGO);
const hasAppCardCoupons = ref(import.meta.env.VITE_HAS_APPCARD_COUPONS === "true");
const hasMidaxCoupons = ref(import.meta.env.VITE_HAS_MIDAX_COUPONS === "true");
const notificationsAvailable = ref(false);

// Add pdfModalState ref
const pdfModalState = ref({
  isOpen: false,
  url: '',
  type: '',
  startDate: ''
});

const requestNotificationPermission = inject('requestNotificationPermission');

// Add this with other refs at the top
const isLocationModalOpen = ref(false);

// Add router to imports if not already present
const router = useRouter();

// Add a watch for debugging
watch(selectedLocation, () => {
  // Empty watch function, no need for newVal parameter
}, { deep: true });

// Update the computed properties
const hasWeeklyAd = computed(() => {
  const weeklyAd = selectedLocation.value?.ads?.find(ad =>
    ad.ad_type.some(type => type.type_name === "Weekly Ad")
  );
  return Boolean(weeklyAd);
});

const hasRewards = computed(() => {
  const rewardsAd = selectedLocation.value?.ads?.find(ad =>
    ad.ad_type.some(type => type.type_name === "Reward")
  );
  return Boolean(rewardsAd);
});

// Add checkSelectedLocation function at the script level
async function checkSelectedLocation() {
  const storedLocation = localStorage.getItem('selectedLocation');
  if (storedLocation) {
    try {
      const parsedLocation = JSON.parse(storedLocation);
      // Always fetch fresh data from the API
      const freshLocationData = await apiLocations.getLocationById(parsedLocation.id);
      if (freshLocationData) {
        selectedLocation.value = freshLocationData;
        localStorage.setItem('selectedLocation', JSON.stringify(freshLocationData));
      }
    } catch (error) {
      // Error handling silently
    }
  }
}

// Update onIonViewDidEnter to always refresh data
onIonViewDidEnter(async () => {
  await checkSelectedLocation();
  await fetchLocationData();
  await getData();
  await fetchNotifications();
});

onMounted(async () => {
  loyaltyNumber.value = getLoyaltyNumber();
  await checkSelectedLocation();
  await fetchLocationData();
  await getData();
  window.addEventListener('locationChanged', handleLocationChange);
  window.addEventListener('forceAppRefresh', handleForceRefresh);
  window.addEventListener('userSignedUp', (event) => {
    loyaltyNumber.value = event.detail.loyaltyNumber;
  });
  await requestNotificationPermission();
});

onUnmounted(() => {
  window.removeEventListener('locationChanged', handleLocationChange);
  window.removeEventListener('forceAppRefresh', handleForceRefresh);
});

// Add force refresh handler
async function handleForceRefresh() {
  await checkSelectedLocation();
  await fetchLocationData();
  await getData();
}

// Enhance location change handler
async function handleLocationChange(event) {
  if (event.detail?.id) {
    selectedLocation.value = event.detail;
    await fetchLocationData();
    await getData();
  }
}

// Enhance fetchLocationData
async function fetchLocationData() {
  if (selectedLocation.value?.id) {
    try {
      const freshLocationData = await apiLocations.getLocationById(selectedLocation.value.id);
      if (freshLocationData) {
        selectedLocation.value = freshLocationData;
        localStorage.setItem('selectedLocation', JSON.stringify(freshLocationData));
      }
    } catch (error) {
      // Error handling silently
    }
  }
}

// Open location modal
function openLocationModal() {
  isLocationModalOpen.value = true;
}

// Handle location selection
async function handleLocationSelected(location) {
  selectedLocation.value = location;
  localStorage.setItem('selectedLocation', JSON.stringify(location));
  await fetchLocationData();
  await getData();
}

// Fetch data from APIs
async function getData() {
  sliders.value = [];
  recipes.value = [];
  spotlights.value = [];

  try {
    const [slidersResponse, recipesResponse, spotlightsResponse] = await Promise.all([
      apiSliders.getSliders(),
      apiRecipes.getRecipes(),
      apiSpotlights.getSpotlights()
    ]);

    sliders.value = slidersResponse;
    recipes.value = Array.isArray(recipesResponse) ? recipesResponse : [];
    spotlights.value = Array.isArray(spotlightsResponse) ? spotlightsResponse : [];
  } catch (err) {
    // Handle error silently
  }
}

// PDF Modal handling
const openPdfModal = (type) => {
  if (!selectedLocation.value) return;

  const modalData = {
    isOpen: true,
    url: '',
    type: '',
    startDate: ''
  };

  switch (type) {
    case 'weekly': {
      const weeklyAd = selectedLocation.value.ads?.find(ad =>
        ad.ad_type.some(type => type.type_name === "Weekly Ad")
      );
      if (weeklyAd) {
        modalData.url = weeklyAd.file_url;
        modalData.type = "Weekly Ad";
        modalData.startDate = weeklyAd.ad_start_date;
      }
      break;
    }
    case 'rewards': {
      const rewardsAd = selectedLocation.value.ads?.find(ad =>
        ad.ad_type.some(type => type.type_name === "Reward")
      );
      if (rewardsAd) {
        modalData.url = rewardsAd.file_url;
        modalData.type = "Reward";
        modalData.startDate = rewardsAd.ad_start_date;
      }
      break;
    }
  }

  pdfModalState.value = modalData;
};

const closePdfModal = (isOpen) => {
  if (!isOpen) {
    pdfModalState.value = {
      isOpen: false,
      url: '',
      type: '',
      startDate: ''
    };
  }
};

// Update the click handlers
const handleWeeklyAdClick = () => {
  if (hasWeeklyAd.value) {
    openPdfModal('weekly');
  } else {
    // If no weekly ad, show the location modal
    isLocationModalOpen.value = true;
  }
};

const handleRewardsClick = () => {
  if (hasRewards.value) {
    openPdfModal('rewards');
  }
};

const handleMyStoreClick = async () => {
  if (selectedLocation.value) {
    router.push(`/locations/${selectedLocation.value.id}`);
  } else {
    await openLocationModal();
  }
};

// In your computed property or where you're mapping sliders
const sliderImages = computed(() => {
  return Array.isArray(sliders.value) ? sliders.value.map(slider => slider.imageUrl) : [];
});

// Fetch notifications
const fetchNotifications = async () => {
  try {
    const response = await apiNotifications.getNotifications();
    notificationsAvailable.value = response.data.length > 0;  // Ensure `.data` is used here
  } catch (error) {
    notificationsAvailable.value = false;
  }
};

// Add ionViewWillEnter hook at the top level of the script
onIonViewWillEnter(async () => {
  // Refresh loyalty number and card number
  loyaltyNumber.value = getLoyaltyNumber();
  
  const storedLocation = localStorage.getItem('selectedLocation');
  if (storedLocation) {
    const parsedLocation = JSON.parse(storedLocation);
    if (parsedLocation?.id !== selectedLocation.value?.id) {
      selectedLocation.value = parsedLocation;
      await fetchLocationData();
      await getData();
    }
  }
});

defineComponent({
  name: 'HomePage',
  // ... existing code ...
});
</script>


<style scoped>
ion-grid {
  --ion-grid-columns: 3 !important;
  --ion-grid-column-padding: 1px;
}
</style>
