<template>
  <div class="ion-margin-bottom">
    <ion-list lines="none" v-if="(!hasMidaxCoupons || hasStoreId) && displayCoupons.length > 0">
      <ion-item @click="goToCouponsArchive">
        <ion-text>
          <h3 class="app-list-heading">
            {{ title }}
            <ion-icon style="font-size: 16px;" name="chevron-right" color="medium"></ion-icon>
          </h3>
          <p class="app-list-subheading">{{ subtitle }}</p>
        </ion-text>
      </ion-item>
    </ion-list>

    <div v-if="!loading">
      <swiper 
        v-if="(!hasMidaxCoupons || hasStoreId) && displayCoupons.length > 0" 
        @swiper="onSwiper" 
        :slides-per-view="2.5" 
        :space-between="1" 
        loop
      >
        <swiper-slide v-for="coupon in displayCoupons" :key="coupon.id">
          <CouponCard :coupon="coupon" @click="goToCouponDetails(coupon.id)" @clip="handleClipCoupon(coupon.id)" />
        </swiper-slide>
      </swiper>
      <!-- <div v-else class="no-store-container">
        <div class="no-store-card">
          <div class="overlay"></div>
          <h3>No Coupons Available</h3>
          <p>Check back later for new deals.</p>
        </div>
      </div> -->
    </div>
    <div v-else>
      <CouponsSkeleton :count="1" />
    </div>
  </div>
</template>

<script setup>
import { computed, watch, onMounted, onUnmounted, ref } from 'vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { IonList, IonItem, IonText, IonIcon } from '@ionic/vue';
import { useRouter } from 'vue-router';
import { useCouponDetails } from '@/composables/useCouponDetails';
import { useClippedCoupons } from '@/composables/useClippedCoupons';
import CouponCard from './CouponCard.vue';
import CouponsSkeleton from './CouponsSkeleton.vue';
import 'swiper/css';
import { TokenStorage } from '@/utils/tokenStorage';
import CouponsApi from '@/axios/apiCoupons';

const props = defineProps({
  limit: {
    type: Number,
    default: 10
  },
  category: {
    type: String,
    default: null
  },
  title: {
    type: String,
    default: 'Clip & Save Coupons'
  },
  subtitle: {
    type: String,
    default: 'Unlock exclusive savings – limited time only!'
  }
});

const router = useRouter();
const { loading, fetchCoupons, fetchWeeklySpecialsCoupons } = useCouponDetails();
// Create local coupons state to prevent state sharing between carousels
const localCoupons = ref([]);
const { 
  addClippedCoupon, 
  showErrorAlert, 
  errorMessage, 
  closeErrorAlert, 
  loadClippedCoupons 
} = useClippedCoupons();
const hasMidaxCoupons = ref(import.meta.env.VITE_HAS_MIDAX_COUPONS === "true");
const storeId = ref(localStorage.getItem('storeId'));
const hasStoreId = computed(() => !!storeId.value);

// Only display up to the limit
const displayCoupons = computed(() => localCoupons.value.slice(0, props.limit));

// Define onSwiper method for Swiper component
const onSwiper = (swiper) => {
  // Store swiper instance if needed for later manipulation
};

// Function to check if we should load coupons and clipped coupons
const loadAllCoupons = async () => {
  const currentStoreId = localStorage.getItem('storeId');
  const currentCardNumber = localStorage.getItem('CardNumber');
  
  if (currentStoreId) {
    try {
      // Check if we need to fetch Weekly Specials or regular coupons
      if (props.category === 'Weekly Specials') {
        // Use Weekly Specials filter
        const response = await fetchWeeklySpecialsCoupons(props.limit, 0);
        localCoupons.value = response.items || [];
      } else {
        // Regular coupons (no category filter)
        const response = await fetchCoupons({ limit: props.limit, offset: 0 });
        localCoupons.value = response.items || [];
      }
    } catch (error) {
      console.error('Error loading coupons:', error);
      localCoupons.value = [];
    }
    
    // If user is logged in (has card number), load their clipped coupons
    if (currentCardNumber) {
      await loadClippedCoupons();
    }
  }
};

// Watch for location changes
watch(() => localStorage.getItem('selectedLocation'), async (newLocation) => {
  if (newLocation) {
    storeId.value = localStorage.getItem('storeId');
    await loadAllCoupons();
  }
});

// Watch for authentication changes
watch(() => TokenStorage.hasTokens(), async (isAuthenticated) => {
  if (isAuthenticated) {
    // When user logs in, reload everything
    await loadAllCoupons();
  }
});

// Watch for user sign up events (in case of new registration)
window.addEventListener('userSignedUp', async () => {
  await loadAllCoupons();
});

// Handle coupon clipping result
const handleClipCoupon = async (couponId) => {
  if (!TokenStorage.hasTokens()) {
    return;
  }

  try {
    await CouponsApi.clipCoupon(couponId);
    addClippedCoupon(couponId);

    // Find and update the coupon directly without creating a new array
    const coupon = localCoupons.value.find(coupon => coupon.id === couponId);
    if (coupon) {
      // Use direct property assignment to maintain reactivity
      coupon.clipped = true;
    }
  } catch (error) {
    console.error('Error clipping coupon:', error);
  }
};

const goToCouponDetails = (couponId) => {
  router.push(`/coupons/${couponId}`);
};

const goToCouponsArchive = () => {
  router.push({ name: 'Coupons' });
};

// Handler function for location change events
const handleLocationChanged = async (event) => {
  // Update storeId ref when location changes
  storeId.value = localStorage.getItem('storeId');
  
  try {
    // Use appropriate fetch method based on category
    if (props.category === 'Weekly Specials') {
      const response = await fetchWeeklySpecialsCoupons(props.limit, 0);
      localCoupons.value = response.items || [];
    } else {
      const response = await fetchCoupons({ limit: props.limit, offset: 0 });
      localCoupons.value = response.items || [];
    }
  } catch (error) {
    console.error('Error updating coupons after location change:', error);
    localCoupons.value = [];
  }
};

// Handler for storage events
const handleStorageChange = (event) => {
  if (event.key === 'storeId' || event.key === 'selectedLocation') {
    storeId.value = localStorage.getItem('storeId');
  }
};

onMounted(async () => {
  // Initialize storeId from localStorage
  storeId.value = localStorage.getItem('storeId');
  

  if (hasMidaxCoupons.value) {
    // Only check for location if using Midax system
    if (storeId.value) {
    await loadAllCoupons();
  }
  } else {
    // For AppCard, fetch coupons immediately
    await loadAllCoupons();
  }
  
  // Listen for location change events
  window.addEventListener('locationChanged', handleLocationChanged);
  
  // Listen for storage events to catch direct localStorage changes
  window.addEventListener('storage', handleStorageChange);
});

// Clean up event listeners when component is unmounted
onUnmounted(() => {
  window.removeEventListener('locationChanged', handleLocationChanged);
  window.removeEventListener('storage', handleStorageChange);
});
</script>

<style scoped>
.swiper {
  padding-left: 12px;
  padding-right: 0px;
}

.swiper-slide {
  display: flex;
  flex-direction: column;
  align-items: center;
}

h3.app-list-heading {
  font-size: 22px !important;
  font-weight: bold;
  margin-bottom: 0px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.app-list-subheading {
  margin-top: 0px;
  color: var(--ion-color-medium);
  font-size: 14px;
  line-height: 1.4;
}

ion-note {
  color: #000;
  font-weight: bold;
}

@media (max-width: 600px) {
  ion-text {
    font-size: 12px;
  }
}

.no-store-container {
  padding: 0 4px 0 16px;
}

.no-store-card {
  text-align: center;
  height: 125px;
  position: relative;
  padding: 12px;
  margin-right: 10px;
}

.no-store-card h3 {
  color: var(--ion-color-danger);
  font-size: 20px;
  font-weight: bold;
  z-index: 10;
  position: relative;
  margin-top: 20px;
}

.no-store-card p {
  color: var(--ion-color-medium);
  font-size: 16px;
  z-index: 10;
  position: relative;
  margin-top: 0px;
}

.no-store-card .overlay {
  background: #f7f7f7;
  border: 1px #eaeaea solid;
  vertical-align: middle;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 8px;
}
</style>