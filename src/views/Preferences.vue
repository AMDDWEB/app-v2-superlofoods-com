<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
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

      <ion-list>
        <ion-list-header>
          <ion-label>
            Preferences
          </ion-label>
        </ion-list-header>
        <ion-item button @click="$router.push('/my-account')" v-if="loyaltyNumber || cardNumber">
          <ion-icon color="primary" name="my-account-regular" slot="start"></ion-icon>
          <ion-label>
            My Account
          </ion-label>
        </ion-item>
        <ion-item button @click="openGeneralNotificationSettings">
          <ion-icon color="primary" name="notifications-settings-regular" slot="start"></ion-icon>
          <ion-label>
            Notification Settings
          </ion-label>
        </ion-item>
        <ion-item button @click="openLocationModal">
          <ion-icon name="my-location-regular" slot="start" color="primary"></ion-icon>
          <ion-label>
            Select My Location
          </ion-label>
        </ion-item>
        <ion-item button @click="$router.push('/notifications')">
          <ion-icon name="my-notifications-regular" slot="start" color="primary"></ion-icon>
          <ion-label>
            My Notifications
          </ion-label>
        </ion-item>
      </ion-list>

      <ion-list>
        <ion-list-header>
          <ion-label>
            More
          </ion-label>
        </ion-list-header>
        <ion-item button @click="openWebsite">
          <ion-icon name="website-regular" color="primary" slot="start"></ion-icon>
          <ion-label>
            Visit Our Website
          </ion-label>
        </ion-item>
        <!-- <ion-item button @click="openMyPoints">
          <ion-icon name="rewards-regular" color="primary" slot="start"></ion-icon>
          <ion-label>
            Check My Points
          </ion-label>
        </ion-item> -->
        <ion-item v-if="facebookUrl" button @click="openFacebook">
          <ion-icon name="facebook" color="primary" slot="start"></ion-icon>
          <ion-label>
            Find Us on Facebook
          </ion-label>
        </ion-item>
        <ion-item v-if="instagramUrl" button @click="openInstagram">
          <ion-icon name="instagram" color="primary" slot="start"></ion-icon>
          <ion-label>
            Follow Us on Instagram
          </ion-label>
        </ion-item>
        <ion-item v-if="twitterUrl" button @click="openTwitter">
          <ion-icon name="twitter" color="primary" slot="start"></ion-icon>
          <ion-label>
            Follow Us on Twitter
          </ion-label>
        </ion-item>
        <ion-item v-if="pinterestUrl" button @click="openPinterest">
          <ion-icon name="pinterest" color="primary" slot="start"></ion-icon>
          <ion-label>
            Pin Us on Pinterest
          </ion-label>
        </ion-item>
        <ion-item v-if="youtubeUrl" button @click="openYouTube">
          <ion-icon name="youtube" color="primary" slot="start"></ion-icon>
          <ion-label>
            Watch Us on YouTube
          </ion-label>
        </ion-item>
      </ion-list>
      <div class="preferences-footer">
        &copy; {{ new Date().getFullYear() }} {{ storeName }}<br>
        <span @click="handleVersionClick">{{ storeName }} v.{{ appVersion }}</span>
      </div>
    </ion-content>

    <!-- Location Modal -->
    <SetLocationModal :is-open="isLocationModalOpen" @update:is-open="isLocationModalOpen = $event"
      @location-selected="handleLocationSelected" />
    <BarcodeModal :isOpen="showBarcodeModal" @update:isOpen="showBarcodeModal = $event" />
  </ion-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted, defineComponent } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonContent, IonList, IonListHeader, IonItem, IonLabel, IonIcon, IonImg } from '@ionic/vue';
import { Browser } from '@capacitor/browser';
import { NativeSettings, AndroidSettings, IOSSettings } from 'capacitor-native-settings';
import SetLocationModal from '@/components/SetLocationModal.vue';
import { Capacitor } from '@capacitor/core';
import { useSignupModal } from '@/composables/useSignupModal';
import BarcodeModal from '@/components/BarcodeModal.vue';

// Store environment variables in reactive variables
const storeName = import.meta.env.VITE_STORE_NAME; // Store name from .env
const appVersion = import.meta.env.VITE_APP_VERSION; // Store name from .env
const hasAppCardCoupons = ref(import.meta.env.VITE_HAS_APPCARD_COUPONS === "true");
const facebookUrl = ref(import.meta.env.VITE_FACEBOOK_URL || '');
const instagramUrl = ref(import.meta.env.VITE_INSTAGRAM_URL || '');
const tiktokUrl = ref(import.meta.env.VITE_TIKTOK_URL || '');
const pinterestUrl = ref(import.meta.env.VITE_PINTEREST_URL || '');
const twitterUrl = ref(import.meta.env.VITE_TWITTER_URL || '');
const youtubeUrl = ref(import.meta.env.VITE_YOUTUBE_URL || '');


// Reactive references
const isLocationModalOpen = ref(false);
const currentLocation = ref(null);
const logoUrl = ref(import.meta.env.VITE_PRIMARY_LOGO);
const clickCount = ref(0);
const clickTimer = ref(null);
const { getLoyaltyNumber } = useSignupModal();
const loyaltyNumber = ref('');
const showBarcodeModal = ref(false);
const cardNumber = ref(localStorage.getItem('CardNumber') || '');

// Add ionViewWillEnter lifecycle hook
const ionViewWillEnter = () => {
    // Check for authentication each time the page is entered
    loyaltyNumber.value = getLoyaltyNumber();
    cardNumber.value = localStorage.getItem('CardNumber') || '';
};

// Expose the ionViewWillEnter hook
defineExpose({ ionViewWillEnter });

// Watch for userSignedUp event
window.addEventListener('userSignedUp', (event) => {
    loyaltyNumber.value = event.detail.loyaltyNumber;
    cardNumber.value = event.detail.cardNumber;
});

// Watch for storage changes
window.addEventListener('storage', (e) => {
    if (e.key === 'cardNumber') {
        cardNumber.value = e.newValue || '';
    }
});

const presentBarcodeModal = () => {
  showBarcodeModal.value = true;
};

// Lifecycle hooks
onMounted(() => {
  // Load stored location on component mount
  const storedLocation = localStorage.getItem('selectedLocation');
  if (storedLocation) {
    currentLocation.value = JSON.parse(storedLocation);
  }

  // Set initial loyalty number
  loyaltyNumber.value = getLoyaltyNumber();

  // Listen for signup event
  window.addEventListener('userSignedUp', (event) => {
    loyaltyNumber.value = event.detail.loyaltyNumber;
  });
});

// Open app general notification settings for testing
async function openGeneralNotificationSettings() {
  try {
    if (Capacitor.getPlatform() === 'ios') {
      await NativeSettings.openIOS({
        option: IOSSettings.App
      });
    } else if (Capacitor.getPlatform() === 'android') {
      await NativeSettings.openAndroid({
        option: AndroidSettings.ApplicationDetails
      });
    }
  } catch (error) {
    // Handle error silently
  }
}
// Open website in browser
async function openWebsite() {
  await Browser.open({
    url: import.meta.env.VITE_SITE_URL,
    presentationStyle: 'popover'
  });
}

// Open Facebook page in browser popover
async function openFacebook() {
  const facebookUrl = import.meta.env.VITE_FACEBOOK_URL;  // Facebook URL from .env

  try {
    await Browser.open({
      url: facebookUrl,
      presentationStyle: 'popover'
    });
  } catch (error) {
    // Handle error silently
  }
}

// Open Instagram page in browser popover
async function openInstagram() {
  const instagramUrl = import.meta.env.VITE_INSTAGRAM_URL; // Instagram URL from .env

  try {
    await Browser.open({
      url: instagramUrl,
      presentationStyle: 'popover'
    });
  } catch (error) {
    // Handle error silently
  }
}

// Open Pinterest page in browser popover
async function openPinterest() {
  const pinterestUrl = import.meta.env.VITE_PINTEREST_URL; // Pinterest URL from .env

  try {
    await Browser.open({
      url: pinterestUrl,
      presentationStyle: 'popover'
    });
  } catch (error) {
    // Handle error silently
  }
}

// Open Twitter (X) page in browser popover
async function openTwitter() {
  const twitterUrl = import.meta.env.VITE_TWITTER_URL; // Twitter URL from .env

  try {
    await Browser.open({
      url: twitterUrl,
      presentationStyle: 'popover'
    });
  } catch (error) {
    // Handle error silently
  }
}

// Open YouTube channel in browser popover
async function openYouTube() {
  const youtubeUrl = import.meta.env.VITE_YOUTUBE_URL; // YouTube URL from .env

  try {
    await Browser.open({
      url: youtubeUrl,
      presentationStyle: 'popover'
    });
  } catch (error) {
    // Handle error silently
  }
}

// Open location modal
function openLocationModal() {
  isLocationModalOpen.value = true;
}

// Handle location selection
function handleLocationSelected(location) {
  localStorage.setItem('selectedLocation', JSON.stringify(location));
  currentLocation.value = location;

  // Emit a custom event to notify other components about the location change
  window.dispatchEvent(new CustomEvent('locationChanged', { detail: location }));
}

// Add the handler function
const handleVersionClick = () => {
  clickCount.value++;

  // Clear existing timer if it exists
  if (clickTimer.value) {
    clearTimeout(clickTimer.value);
  }

  // Set new timer to reset clicks after 2 seconds
  clickTimer.value = setTimeout(() => {
    clickCount.value = 0;
  }, 2000);

  // Only proceed if we've reached 5 clicks
  if (clickCount.value === 5) {
    try {
      // Reset click count
      clickCount.value = 0;

      // Clear the timer
      clearTimeout(clickTimer.value);

      // Clear everything in localStorage
      window.localStorage.clear();

      // Remove specific items
      window.localStorage.removeItem('selectedLocation');
      window.localStorage.removeItem('currentLocation');
      window.localStorage.removeItem('refresh_token');

      // Reset the reactive ref
      currentLocation.value = null;

      // Force a complete page reload
      window.location.href = '/';

    } catch (error) {
      // Handle error silently
    }
  }
};

// Update cleanup to remove all event listeners
onUnmounted(() => {
    if (clickTimer.value) {
        clearTimeout(clickTimer.value);
    }
    
    // Remove event listeners
    window.removeEventListener('userSignedUp', (event) => {
        loyaltyNumber.value = event.detail.loyaltyNumber;
        cardNumber.value = event.detail.cardNumber;
    });
    
    window.removeEventListener('storage', (e) => {
        if (e.key === 'cardNumber') {
            cardNumber.value = e.newValue || '';
        }
    });
});

defineComponent({ name: 'PreferencesPage' });
</script>

<style scoped>
.preferences-footer {
  text-align: center !important;
  font-size: 14px;
  margin-top: 32px;
  align-content: center;
  color: var(--ion-color-medium);
}

ion-icon {
  color: var(--ion-color-primary) !important;
}

.loyalty-card {
  background: var(--ion-color-light);
  margin-top: 16px;
  margin-right: 16px;
  margin-left: 16px;
  padding: 16px;
  border-radius: 12px;
  border-style: solid;
  border-width: 1px;
  border-color: var(--ion-color-light-shade);
  /* box-shadow: 0 2px 4px rgba(0,0,0,0.1); */
}

.loyalty-label {
  color: var(--ion-color-medium);
  font-size: 14px;
  margin-bottom: 4px;
}

.loyalty-number {
  color: var(--ion-color-dark);
  font-size: 18px;
  font-weight: 600;
}
</style>
