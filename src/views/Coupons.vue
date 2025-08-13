<template>
  <IonPage>
    <ion-header>
      <!-- All/Clipped Toggle First -->
      <ion-toolbar>
        <ion-segment class="coupon-toggle" v-model="selectedView">
          <ion-segment-button value="all">
            <ion-label>All Coupons</ion-label>
          </ion-segment-button>
          <ion-segment-button value="clipped">
            <ion-label>Clipped Coupons</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>

      <!-- Category Menu Second -->
      <ion-toolbar>
        <ion-segment
          mode="ios"
          scrollable
          class="ion-padding-start coupon-categories coupon-categories-ion-segment"
          :value="selectedCategory"
        >
          <ion-segment-button class="coupon-categories-ion-segment-button"
            v-for="category in sortedCategories"
            :key="category"
            :value="category"
            @click="setCategory(category)"
          >
            {{ category }}
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>

      <!-- Search Bar Third -->
      <ion-toolbar>
        <div class="app-search-container">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" class="app-custom-search-icon">
            <path d="M0 56l0 80c0 13.3 10.7 24 24 24s24-10.7 24-24l0-80c0-4.4 3.6-8 8-8l80 0c13.3 0 24-10.7 24-24s-10.7-24-24-24L56 0C25.1 0 0 25.1 0 56zM0 376l0 80c0 30.9 25.1 56 56 56l80 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-80 0c-4.4 0-8-3.6-8-8l0-80c0-13.3-10.7-24-24-24s-24 10.7-24 24zM128 152l0 208c0 13.3 10.7 24 24 24l16 0c13.3 0 24-10.7 24-24l0-208c0-13.3-10.7-24-24-24l-16 0c-13.3 0-24 10.7-24 24zm96-8l0 224c0 8.8 7.2 16 16 16s16-7.2 16-16l0-224c0-8.8-7.2-16-16-16s-16 7.2-16 16zm64 8l0 168c0-52.4 25.1-98.8 64-128l0-40c0-13.3-10.7-24-24-24l-16 0c-13.3 0-24 10.7-24 24zm0 168l0 40c0 8.9 4.8 16.6 11.9 20.8C292.2 362 288 341.5 288 320zm32 0c0 70.7 57.3 128 128 128c26.7 0 51.4-8.2 71.9-22.1l.1-.1 79.1 79.1c9.3 9.4 24.5 9.3 33.9 0s9.4-24.5 0-33.9l-79.1-79.1C567.8 371.4 576 346.7 576 320c0-70.7-57.3-128-128-128s-128 57.3-128 128zm48 0c0-28.6 15.2-55 40-69.3s55.2-14.3 80 0s40 40.7 40 69.3s-15.2 55-40 69.3s-55.2 14.3-80 0s-40-40.7-40-69.3zm16-168l0 21.3c19.6-8.6 41.2-13.3 64-13.3l0-8c0-13.3-10.7-24-24-24l-16 0c-13.3 0-24 10.7-24 24zM416 24c0 13.3 10.7 24 24 24l80 0c4.4 0 8 3.6 8 8l0 80c0 13.3 10.7 24 24 24s24-10.7 24-24l0-80c0-30.9-25.1-56-56-56L440 0c-13.3 0-24 10.7-24 24zm0 464c0 13.3 10.7 24 24 24l80 0c5.5 0 10.9-.8 15.9-2.3L498.2 472c-15.8 5.2-32.6 8-50.2 8c-10.1 0-19.9-.9-29.5-2.7c-1.6 3.2-2.5 6.9-2.5 10.7z"/>
          </svg>
          <input
            v-model="searchQuery"
            placeholder="Search coupons..."
            @input="handleSearch"
            class="app-search-input"
          />
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="coupon-grid">
        <!-- Show skeleton loaders when loading -->
        <div v-if="loading" class="coupon-container">
          <CouponsSkeleton :count="6" />
        </div>
        
        <ion-toast v-else-if="selectedView === 'clipped' && displayedCoupons.length === 0 && !isProcessingCoupons"
          :is-open="selectedView === 'clipped' && displayedCoupons.length === 0 && !isProcessingCoupons"
          message="When clipped, your coupons will be located here."
          color="danger"
          duration="3000"
          position="bottom"
          position-anchor="mainTabBar"
        />

        <!-- Always show the coupon container if we have any coupons or are loading -->
        <div v-if="displayedCoupons.length > 0 || loading" class="coupon-container">
          <!-- Show available coupons -->
          <template v-if="displayedCoupons.length > 0">
            <CouponCard
              v-for="coupon in displayedCoupons"
              :key="coupon.id"
              :coupon="coupon"
              @click="goToCouponDetails(coupon.id)"
              @clipped="handleClip"
            />
            <div v-if="loadingClipped" class="loading-more-container">
              <CouponsSkeleton :count="1" />
            </div>
          </template>
        </div>
      </div>

      <ion-toast
        :is-open="showSearchToast"
        :message="`Your search for '${searchQuery}' returned ${displayedCoupons.length} coupons.`"
        color="success"
        position="bottom"
      />
      <ion-toast
        :is-open="showClippedToast"
        :message="`You have ${displayedCoupons.length} clipped coupons.`"
        color="warning"
        duration="3000"
        position="bottom"
        position-anchor="mainTabBar"
      />
      <ion-toast
        :is-open="showClipSuccess"
        @didDismiss="resetClipSuccess"
        :message="`'${lastClippedTitle}' has been successfully clipped.`"
        color="success"
        duration="3000"
        position="bottom"
        position-anchor="mainTabBar"
      />
      <ion-toast
        :is-open="selectedView === 'all' && selectedCategory !== 'All Coupons' && showCountToast"
        @didDismiss="showCountToast = false"
        :message="selectedCategory === 'All Coupons' ? `You have ${categoryCounts[selectedCategory] ?? 0} available coupons to clip.` : `${selectedCategory} has ${categoryCounts[selectedCategory] ?? 0} available coupons.`"
        color="warning"
        duration="2500"
        position="bottom"
        position-anchor="mainTabBar"
      />
    </ion-content>

    <SignupModal />
  </IonPage>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { useCouponDetails } from '@/composables/useCouponDetails';
import { useSignupModal } from '@/composables/useSignupModal';
import { useClippedCoupons } from '@/composables/useClippedCoupons';
import { useRouter } from 'vue-router';
import CouponCard from '@/components/CouponCard.vue';
import CouponsSkeleton from '@/components/CouponsSkeleton.vue';
import { IonPage, IonHeader, IonToolbar, IonContent, IonSegment, IonSegmentButton, 
         IonLabel, IonToast } from '@ionic/vue';
import { defineComponent } from 'vue';

const router = useRouter();
const { coupons, loading, fetchCoupons, availableCategories, fetchCategories, isMidax, getCategoryByName } = useCouponDetails();
const { SignupModal } = useSignupModal();
const { isCouponClipped, syncClippedCoupons, showErrorAlert, errorMessage, closeErrorAlert, cleanupExpiredCoupons, hasLoadedInitial } = useClippedCoupons();

// Track if we're loading clipped coupons specifically
const loadingClipped = ref(false);

const offset = ref(0);
const limit = ref(isMidax.value ? 20 : 1000);
const selectedView = ref('all');
const selectedCategory = ref('All Coupons');
const searchQuery = ref('');
const searchTimeout = ref(null);
const uniqueCouponIds = ref(new Set());
const isProcessingCoupons = ref(false); // Track if we're still processing coupons

const categoryCounts = ref({});
const showCountToast = ref(false);

const readTotalFromResponse = (response) => {
  // Try common server-side total shapes; fall back to items length
  return (
    response?.total ??
    response?.data?.total ??
    response?.data?.totalItems ??
    response?.data?.count ??
    response?.count ??
    (Array.isArray(response?.items) ? response.items.length : undefined) ??
    (Array.isArray(response?.data?.items) ? response.data.items.length : undefined) ??
    0
  );
};

const sortedCategories = computed(() => {
  // Exclude "All Coupons" and "Weekly Specials" from alphabetical sort
  const otherCategories = availableCategories.value
    .filter(category => category !== 'All Coupons' && category !== 'Weekly Specials')
    .sort((a, b) => a.localeCompare(b));

  // Start with "All Coupons" always first
  const result = ['All Coupons'];
  // Then add "Weekly Special" if present
  if (availableCategories.value.includes('Weekly Specials')) {
    result.push('Weekly Specials');
  }
  // Finally, append the rest alphabetically
  return [...result, ...otherCategories];
});

// Watch for changes in the coupons array to sync clipped coupons
watch(coupons, (newCoupons) => {
  if (newCoupons && Array.isArray(newCoupons)) {
    syncClippedCoupons(newCoupons);
  }
});

// Watch for changes to selectedView to cleanup expired coupons when viewing clipped
watch(selectedView, async (newView) => {
  if (newView !== 'all') {
    showCountToast.value = false;
  }
  if (newView === 'clipped') {
    isProcessingCoupons.value = true;
    try {
      await cleanupExpiredCoupons();
      // Small delay to ensure the UI updates
      await new Promise(resolve => setTimeout(resolve, 50));
    } finally {
      isProcessingCoupons.value = false;
    }
  }
});

// Watch searchQuery with debouncing
watch(searchQuery, (newQuery) => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  searchTimeout.value = setTimeout(() => {
    // Since all coupons are loaded upfront, we don't need to fetch again
    // The displayedCoupons computed property will handle filtering
  }, 300);
});

const displayedCoupons = computed(() => {
  // If we're still loading, return an empty array to show loading state
  if (loading.value) {
    return [];
  }

  let filtered = [...coupons.value]; // Create a shallow copy to avoid mutating the original array

  // Filter by category if not "All Coupons" (support both string and object categories)
  if (selectedCategory.value !== 'All Coupons') {
    filtered = filtered.filter(coupon => {
      const cat = coupon.category;
      const catName = typeof cat === 'string' 
        ? cat 
        : (cat?.Name || cat?.name || '');
      return catName === selectedCategory.value;
    });
  }

  // Filter by clipped status
  if (selectedView.value === 'clipped') {
    filtered = filtered.filter(coupon => isCouponClipped(coupon.id));
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase().trim();
    filtered = filtered.filter(coupon =>
      coupon.title?.toLowerCase().includes(query) ||
      coupon.description?.toLowerCase().includes(query) ||
      coupon.category?.toLowerCase().includes(query) ||
      coupon.disclaimer?.toLowerCase().includes(query) ||
      coupon.to_date?.toLowerCase().includes(query) ||
      coupon.subtitle?.toLowerCase().includes(query)
    );
  }

  // Ensure unique coupons by ID
  const uniqueCoupons = new Map();
  filtered.forEach(coupon => {
    if (!uniqueCoupons.has(coupon.id)) {
      uniqueCoupons.set(coupon.id, coupon);
    }
  });

  return Array.from(uniqueCoupons.values());
});

const showSearchToast = computed(() => 
    Boolean(searchQuery.value) && 
    searchQuery.value.length >= 3 && 
    !loading.value && 
    displayedCoupons.value.length > 0
);
const showClipSuccess = ref(false);
const lastClippedTitle = ref('');

function handleClip(coupon) {
  // Success toast only - errors are now handled by useClippedCoupons
  lastClippedTitle.value = coupon.title;
  showClipSuccess.value = true;
}

function resetClipSuccess() {
  showClipSuccess.value = false;
}

// Clear toast state when navigating away
onBeforeRouteLeave((to, from, next) => {
  searchQuery.value = '';
  selectedView.value = 'all';
  showClipSuccess.value = false;
  next();
});


const showClippedToast = computed(() =>
  selectedView.value === 'clipped' &&
  displayedCoupons.value.length > 0
);

// Function to load all coupons
const loadAllCoupons = async () => {
  // Store the current category and view to handle race conditions
  const currentCategory = selectedCategory.value;
  const currentView = selectedView.value;
  const isClippedView = currentView === 'clipped' && currentCategory === 'All Coupons';
  
  // Set loading state
  if (isClippedView) {
    loadingClipped.value = true;
  }
  
  const maxCoupons = 5000; // Safety limit to prevent infinite loops
  let totalLoaded = 0;
  let hasMore = true;
  let isFirstBatch = true;

  try {
    while (hasMore && totalLoaded < maxCoupons) {
      // Check if the category has changed since we started loading
      if (selectedCategory.value !== currentCategory) {
        return; // Stop loading if category changed
      }
      
      // Prefer server-side filtering by category when possible
      const categoryObj = getCategoryByName(selectedCategory.value);
      const response = await fetchCoupons({ 
        limit: limit.value, 
        offset: offset.value,
        category: categoryObj || null,
        manageLoading: false,
        skipState: true
      });
      
      const items = response?.items || response?.data?.items || [];
      hasMore = items.length > 0;

      if (items.length === 0) {
        // If no items and it's the first batch, clear any existing coupons
        if (isFirstBatch) {
          coupons.value = [];
        }
        break; // No more coupons to load
      }

      // Filter out duplicates and add to the existing coupons
      const newCoupons = items.filter(coupon => !uniqueCouponIds.value.has(coupon.id));
      
      if (newCoupons.length > 0) {
        newCoupons.forEach(coupon => uniqueCouponIds.value.add(coupon.id));
        
        // Update the coupons array with the new batch
        coupons.value = [...coupons.value, ...newCoupons];
        totalLoaded += newCoupons.length;
      }
      
      // Update category counts on first batch
      if (isFirstBatch) {
        const total = readTotalFromResponse(response);
        categoryCounts.value = {
          ...categoryCounts.value,
          [selectedCategory.value]: total
        };
        loading.value = false; // Hide initial loading spinner after first batch
        isFirstBatch = false;
      }
      
      offset.value += limit.value;
      
      // Small delay to allow the UI to update between batches
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  } catch (error) {
    console.error('Error loading coupons:', error);
  } finally {
    // Update loading states based on current view
    if (selectedCategory.value === currentCategory && selectedView.value === currentView) {
      loading.value = false;
      
      // For clipped view, only clear loadingClipped when we've finished loading all coupons
      if (isClippedView) {
        // Small delay to ensure all coupons are processed before hiding the loader
        await new Promise(resolve => setTimeout(resolve, 100));
        loadingClipped.value = false;
      }
    }
  }
};

const setCategory = async (category) => {
  // Don't do anything if clicking the same category
  if (selectedCategory.value === category) return;
  
  // Reset states for the new category
  loading.value = true;
  isProcessingCoupons.value = true;
  offset.value = 0; // Reset offset for the new category
  uniqueCouponIds.value.clear(); // Clear the set of loaded coupon IDs
  const previousCategory = selectedCategory.value;
  selectedCategory.value = category;
  
  // Clear existing coupons immediately
  coupons.value = [];
  
  // Force UI to update
  await new Promise(resolve => setTimeout(resolve, 0));
  
  try {
    // Load the coupons for the new category
    await loadAllCoupons();
    showCountToast.value = category !== 'All Coupons';  // showCountToast.value = category !== 'All Coupons';
    // Small delay to ensure the UI has time to update
    await new Promise(resolve => setTimeout(resolve, 100));
  } catch (error) {
    console.error('Error loading category:', category, error);
  } finally {
    // Only update states if we're still on the same category
    if (selectedCategory.value === category) {
      loading.value = false;
      // Small delay before marking as done processing to prevent flash of empty state
      setTimeout(() => {
        isProcessingCoupons.value = false;
      }, 100);
    } else {
      // If category changed while loading, make sure to reset processing state
      isProcessingCoupons.value = false;
    }
  }
};

const goToCouponDetails = (couponId) => {
  router.push(`/coupons/${couponId}`);
};

const handleSearch = () => {
  // Debouncing is handled by the watch function
};

onMounted(async () => {
  await fetchCategories();
  await loadAllCoupons();
  showCountToast.value = selectedCategory.value !== 'All Coupons';
  window.addEventListener('userSignedUp', () => {
    loadAllCoupons();
  });
});

onUnmounted(() => {
  window.removeEventListener('userSignedUp', () => loadAllCoupons());
});

defineComponent({ name: 'CouponsPage' });
</script>

<style scoped>
.coupon-grid {
  padding-top: 20px;
  padding-left: 10px;
  padding-right: 10px;
}

.coupon-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  row-gap: 14px;
  column-gap: 6px;
}

.coupon-categories-ion-segment {
  --background: var(--ion-color-light);
}
.coupon-categories-ion-segment-button::before {
  content: none;
}
.coupon-categories-ion-segment-button {
  border: none;
  text-transform: capitalize;
  margin-bottom: 8px;
  margin-left: 0px;
}
.coupon-categories-ion-segment-button.segment-button-checked {
  background: var(--ion-color-primary) !important;
  color: #fff;
}
.coupon-categories-ion-segment-button::part(indicator-background) {
  height: 0px;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.no-coupons {
  text-align: center;
  padding: 32px;
  color: var(--ion-color-medium);
}

.search-info {
  text-align: center;
  padding: 10px;
  color: var(--ion-color-medium);
}

@media (min-width: 768px) {
  .coupon-container {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1024px) {
  .coupon-container {
    grid-template-columns: repeat(4, 1fr);
  }
}

.ion-padding-start {
    --padding-start: var(--ion-padding, 8px);
    -webkit-padding-start: var(--ion-padding, 8px);
    padding-inline-start: var(--ion-padding, 8px);
}
</style>