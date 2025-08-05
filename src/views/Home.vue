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
          <ion-button @click="navigateToSelectedStore" v-if="selectedLocation" class="ion-padding-end">
            <ion-icon name="my-location-regular" size="medium"></ion-icon>
          </ion-button>

          <ion-button @click="presentBarcodeModal" v-if="hasAppCardCoupons && loyaltyNumber" class="ion-padding-end">
            <ion-icon color="primary" name="my-barcode-regular" size="medium"></ion-icon>
          </ion-button>

          <ion-button @click="$router.push('/grocery-list')" class="ion-padding-end-small">
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
              Market+
            </ion-button>
          </ion-col>
          <ion-col>
            <ion-button expand="block" size="small" @click="openShop" color="primary">
              <ion-icon slot="start" name="cart-shopping-regular"></ion-icon>
              Shop Now
            </ion-button>
          </ion-col>

        </ion-row>
      </ion-grid>

      <!-- Spotlights Carousel -->
      <SpotlightsCarousel :spotlights="spotlights" />
      
      <!-- Weekly Specials Carousel -->
      <CouponsCarousel 
        v-if="(hasAppCardCoupons || hasMidaxCoupons) && selectedLocation" 
        category="Weekly Specials"
        title="This Week's Specials"
        subtitle="Check out this week's exclusive deals!"
        :limit="10"
      />
      
      <!-- Regular Coupons Carousel (excludes weekly specials) -->
      <CouponsCarousel 
        v-if="(hasAppCardCoupons || hasMidaxCoupons) && selectedLocation" 
        title="Clip & Save Coupons"
        subtitle="Unlock exclusive savings – limited time only!"
        :exclude-categories="['Weekly Specials']"
        :limit="10"
      />

      <!-- Featured Recipes Carousel -->
      <RecipeCarousel />

      <!-- Location Modal -->
      <SetLocationModal 
        :is-open="isLocationModalOpen" 
        :show-close-button="!isInitialLocationCheck"
        @update:is-open="isLocationModalOpen = $event"
        @location-selected="handleLocationSelected" 
      />

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

import apiSpotlights from '../axios/apiSpotlights.js';
import apiLocations from '../axios/apiLocations.js'; // Import the API for locations

import SpotlightsCarousel from '@/components/SpotlightsCarousel.vue';
import SetLocationModal from '@/components/SetLocationModal.vue';
import PdfViewerModal from '@/components/PdfViewerModal.vue';
import CouponsCarousel from '@/components/CouponsCarousel.vue';
import RecipeCarousel from '@/components/RecipeCarousel.vue';
import { IonPage, IonHeader, IonToolbar, IonContent, IonButtons, IonButton, IonIcon, IonTitle, IonImg, IonGrid, IonRow, IonCol } from '@ionic/vue';
import { useRouter } from 'vue-router';
import { useLocationDetails } from '@/composables/useLocationDetails';
import { useSignupModal } from '@/composables/useSignupModal';
import BarcodeModal from '@/components/BarcodeModal.vue';
import apiNotifications from '../axios/apiNotifications.js'; // Import your API for notifactions
import { onIonViewDidEnter, onIonViewWillEnter } from '@ionic/vue';
import { defineComponent } from 'vue';
import { Browser } from '@capacitor/browser';

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

const spotlights = ref([]);
const { transformLocationData } = useLocationDetails();

const selectedLocation = ref(null);

// Helper to set and persist selected location with transformed fields
function updateSelectedLocation(rawLocation) {
  const transformed = transformLocationData(rawLocation);
  selectedLocation.value = transformed;
  localStorage.setItem('selectedLocation', JSON.stringify(transformed));
}
const logoUrl = ref(import.meta.env.VITE_PRIMARY_LOGO);
const hasAppCardCoupons = ref(import.meta.env.VITE_HAS_APPCARD_COUPONS === "true");
const hasMidaxCoupons = ref(import.meta.env.VITE_HAS_MIDAX_COUPONS === "true");
const notificationsAvailable = ref(false);
const isInitialLocationCheck = ref(true); // Track if this is the initial location check
const isLocationModalOpen = ref(false);
const pdfModalState = ref({
  isOpen: false,
  url: '',
  type: '',
  startDate: ''
});

const requestNotificationPermission = inject('requestNotificationPermission');

// Add router to imports if not already present
const router = useRouter();

// Navigate to the selected store's details page
const navigateToSelectedStore = () => {
  if (selectedLocation.value?.id) {
    router.push(`/locations/${selectedLocation.value.id}`);
  }
};

// Add a watch for debugging
watch(selectedLocation, () => {
  // Empty watch function, no need for newVal parameter
}, { deep: true });

// Update the computed properties
// Determine if the selected location has a weekly ad available
const hasWeeklyAd = computed(() => {
  if (selectedLocation.value?.weekly_ad_url) return true;
  // Fallback to legacy ads array structure
  const weeklyAd = selectedLocation.value?.ads?.find(ad =>
    ad.ad_type?.some(type => type.type_name === 'Weekly Ad')
  );
  return Boolean(weeklyAd);
});

// Determine if the selected location has rewards available
const hasRewards = computed(() => {
  if (selectedLocation.value?.rewards_url) return true;
  // Fallback to legacy ads array
  const rewardsAd = selectedLocation.value?.ads?.find(ad =>
    ad.ad_type?.some(type => type.type_name === 'Rewards')
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
        updateSelectedLocation(freshLocationData);
        localStorage.setItem('selectedLocation', JSON.stringify(freshLocationData));
        isInitialLocationCheck.value = false; // Initial check complete
        return true;
      }
    } catch (error) {
      // Error handling silently
    }
  }
  // If we get here, either there was no stored location or it was invalid
  // Show the location modal if we're not already showing it
  if (!isLocationModalOpen.value) {
    isLocationModalOpen.value = true;
  }
  return false;
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
    updateSelectedLocation(event.detail);
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
        updateSelectedLocation(freshLocationData);
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
  updateSelectedLocation(location);
  localStorage.setItem('selectedLocation', JSON.stringify(location));
  
  // Dispatch a custom event to notify components about the location update
  const locationUpdatedEvent = new CustomEvent('locationUpdated', {
    detail: { location }
  });
  window.dispatchEvent(locationUpdatedEvent);
  
  await fetchLocationData();
  await getData();
}

// Fetch data from APIs
async function getData() {
  sliders.value = [];
  recipes.value = [];
  spotlights.value = [];

  try {
    const [slidersResponse, spotlightsResponse] = await Promise.all([
      apiSliders.getSliders(),
      apiSpotlights.getSpotlights()
    ]);

    sliders.value = slidersResponse;
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
      if (selectedLocation.value.weekly_ad_url) {
        modalData.url = selectedLocation.value.weekly_ad_url;
        modalData.type = selectedLocation.value.weekly_ad_type || 'Weekly Ad';
        modalData.startDate = selectedLocation.value.weekly_ad_start_date || '';
      }
      break;
    }
    case 'rewards': {
      // First check for direct rewards_url
      if (selectedLocation.value.rewards_url) {
        modalData.url = selectedLocation.value.rewards_url;
        modalData.type = selectedLocation.value.rewards_type || 'Rewards';
        modalData.startDate = selectedLocation.value.rewards_start_date || '';
      } else {
        // Fall back to finding in ads array
        const rewardsAd = selectedLocation.value.ads?.find(ad => 
          ad.ad_type?.some(type => type.type_name === 'Rewards')
        );
        if (rewardsAd) {
          modalData.url = rewardsAd.file_url;
          modalData.type = rewardsAd.ad_type?.[0]?.type_name || 'Rewards';
          modalData.startDate = rewardsAd.ad_start_date || '';
        }
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
      updateSelectedLocation(parsedLocation);
      await fetchLocationData();
      await getData();
    }
  }
});

// Add the openShop function
const openShop = async () => {
  await Browser.open({
    url: 'https://www.mymarketdelivers.com/',
    presentationStyle: 'popover',
    windowName: '_blank'
  });
};

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
