<template>
    <ion-page>
    <IonActionSheet
      :is-open="showActionSheet"
      :buttons="actionSheetButtons"
      @did-dismiss="showActionSheet = false"
    />
    <!-- Page header: back button, title, and sort control -->
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-button @click="$router.go(-1)">
                        <ion-icon slot="icon-only" color="primary" name="back-button" class="toolbar-icon"></ion-icon>
                    </ion-button>
                </ion-buttons>
                <ion-title>My Grocery List</ion-title>
                <ion-buttons slot="end">
                    <ion-button v-if="items.length" @click="showActionSheet = true">
                        <ion-icon slot="icon-only" color="primary" name="sort-grocery-list-regular"
                            class="toolbar-icon"></ion-icon>
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>

            <!-- Search bar and coupon suggestions dropdown -->
            <ion-toolbar>
                <div class="app-search-container">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" class="app-custom-search-icon">
                        <path
                            d="M0 416c0 22.9 12.2 44 32 55.4s44.2 11.4 64 0s32-32.6 32-55.4s-12.2-44-32-55.4s-44.2-11.4-64 0S0 393.1 0 416zM8.6 64c-11.4 19.8-11.4 44.2 0 64S41.1 160 64 160s44-12.2 55.4-32s11.4-44.2 0-64S86.9 32 64 32S20 44.2 8.6 64zm0 160c-11.4 19.8-11.4 44.2 0 64S41.1 320 64 320s44-12.2 55.4-32s11.4-44.2 0-64S86.9 192 64 192s-44 12.2-55.4 32zM40 256c0-13.3 10.7-24 24-24s24 10.7 24 24s-10.7 24-24 24s-24-10.7-24-24zm0 160c0-13.3 10.7-24 24-24s24 10.7 24 24s-10.7 24-24 24s-24-10.7-24-24zM160 96c0 13.3 10.7 24 24 24l304 0c13.3 0 24-10.7 24-24s-10.7-24-24-24L184 72c-13.3 0-24 10.7-24 24zm0 160c0 13.3 10.7 24 24 24l159.5 0c10.6-18.4 24.5-34.6 40.7-48L184 232c-13.3 0-24 10.7-24 24zm0 160c0 13.3 10.7 24 24 24l151.4 0c-6.7-15-11.4-31.1-13.8-48L184 392c-13.3 0-24 10.7-24 24zm192-48c0 79.5 64.5 144 144 144s144-64.5 144-144s-64.5-144-144-144s-144 64.5-144 144zm64 0c0-8.8 7.2-16 16-16l48 0 0-48c0-8.8 7.2-16 16-16s16 7.2 16 16l0 48 48 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-48 0 0 48c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-48-48 0c-8.8 0-16-7.2-16-16z" />
                    </svg>
                    <IonInput v-model="newItem" placeholder="Add to my list..." @focus="openSuggestionsModal"
                        @ionInput="openSuggestionsModal" @keydown.enter="addItem" class="app-search-input" />
                </div>
                <IonList v-if="suggestions.length" lines="full" class="suggestion-list">
                    <IonItem button detail="false" lines="full" v-for="coupon in suggestions" :key="coupon.id"
                        @click="addSuggestion(coupon)">
                        <IonLabel>
                            <h3 class="grocery-item">{{ coupon.subtitle }}</h3>
                            <p class="suggestion-description">{{ coupon.description }}</p>
                        </IonLabel>
                        <IonBadge class="coupon-savings-badge-suggest" color="success">
                          {{ coupon.title }}
                        </IonBadge>
                    </IonItem>
                </IonList>
            </ion-toolbar>
        </ion-header>

        <ion-content>

            <!-- Grocery list: items with checkbox fade and swipe-to-delete -->
            <transition-group name="list" tag="IonList">
                <IonItemSliding v-for="item in items" :key="item.id">
                    <IonItem :class="{ 'fade-out': item.removing }" lines="full">
                        <IonCheckbox slot="start" @ionChange="removeViaCheckbox(item)" color="primary" />
                        <IonLabel>
                            <h3 class="grocery-item">{{ item.text }}</h3>
                            <!-- <p class="helper-text" v-if="item.helperText">{{ item.helperText }}</p> -->
                        </IonLabel>
                        <IonBadge
                          v-if="item.badgeText"
                          class="coupon-savings-badge"
                          color="success"
                        >
                          {{ item.badgeText }}
                        </IonBadge>
                    </IonItem>
                    <IonItemOptions side="end">
                        <IonItemOption color="danger" @click="removeItem(item)">
                            <IonIcon slot="icon-only" name="trash-can-regular" color="light" />
                        </IonItemOption>
                    </IonItemOptions>
                </IonItemSliding>
            </transition-group>

            <!-- Sort confirmation alert -->
            <IonAlert :is-open="showSortAlert" header="Sort Grocery List?"
                message="This action cannot be undone. Do you want to sort your grocery items alphabetically?" :buttons="[
                    { text: 'Cancel', role: 'cancel', handler: () => showSortAlert = false },
                    { text: 'Sort', handler: () => { sortItems(); showSortToast = true; } }
                ]" />

            <IonAlert
              :is-open="showClearAlert"
              header="Clear Grocery List?"
              message="This action cannot be undone. Do you want to clear your grocery list?"
              :buttons="[
                { text: 'Cancel', role: 'cancel', handler: () => showClearAlert = false },
                { text: 'Clear', handler: clearList }
              ]"
            />

            <!-- Toast for empty list notification -->
            <IonToast :is-open="showEmptyToast" message="Your list is empty. Please add grocery items." duration="3000"
                position="bottom" class="custom-toast" @did-dismiss="showEmptyToast = false" />

            <!-- Toast confirming item added -->
            <IonToast :is-open="showAddToast" :message="`'${addedText}' has been added to your grocery list.`" duration="1500"
                position="bottom" class="success-toast" @did-dismiss="showAddToast = false" />

            <!-- Sort success toast -->
            <IonToast
              :is-open="showSortToast"
              message="Your grocery list is sorted alphabetically."
              duration="3000"
              position="bottom"
              class="success-toast"
              @did-dismiss="showSortToast = false"
            />
            <!-- Clear success toast -->
            <IonToast
              :is-open="showClearToast"
              message="Your grocery list has been cleared."
              duration="3000"
              position="bottom"
              class="success-toast"
              @did-dismiss="showClearToast = false"
            />
        </ion-content>
    </ion-page>
</template>

<script setup>
// Import Vue refs, Ionic components, and coupon APIs/utilities
import CouponsApi from '@/axios/apiCoupons';
import { TokenStorage } from '@/utils/tokenStorage';
import { useClippedCoupons } from '@/composables/useClippedCoupons.js';
const { addClippedCoupon } = useClippedCoupons();
import { ref, watch, onMounted, computed } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonTitle,
    IonContent,
    IonIcon,
    IonInput,
    IonList,
    IonItem,
    IonCheckbox,
    IonLabel,
    IonAlert,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonToast,
    IonBadge,
    IonNote,
    IonActionSheet
} from '@ionic/vue';
import { useCouponDetails } from '@/composables/useCouponDetails.js';

// Reactive input for new grocery item text
const newItem = ref('');
// Reactive array of grocery list items
const items = ref([]);
// Controls visibility of the sort confirmation alert
const showSortAlert = ref(false);
// Controls toast when list is empty on load
const showEmptyToast = ref(false);
// Controls and text for add-item confirmation toast
const showAddToast = ref(false);
const addedText = ref('');
const showSuggestionsModal = ref(false);

// Controls visibility of Sort/Clear action sheet
const showActionSheet = ref(false);
// Controls alert for clearing list
const showClearAlert = ref(false);
// Controls toast on successful sort
const showSortToast = ref(false);
// Controls toast on successful clear
const showClearToast = ref(false);

const actionSheetButtons = [
  {
    text: 'Sort Alphabetically',
    handler: () => {
      showSortAlert.value = true;
    }
  },
  {
    text: 'Clear List',
    handler: () => {
      showClearAlert.value = true;
    }
  },
  {
    text: 'Cancel',
    role: 'cancel'
  }
];

function openSuggestionsModal() {
    showSuggestionsModal.value = true;
}
function closeSuggestionsModal() {
    showSuggestionsModal.value = false;
}

// Coupons fetched for matching suggestions
const { coupons, fetchCoupons } = useCouponDetails();

// Initialize list from localStorage and fetch coupons
onMounted(async () => {
    const stored = localStorage.getItem('grocery-items');
    if (stored) {
        items.value = JSON.parse(stored).map(i => ({ ...i, removing: false }));
    }
    await fetchCoupons();
    if (!items.value.length) {
        showEmptyToast.value = true;
    }
});

// Define minimum length for suggestions
const minSuggestionLength = 4; // only start suggesting after 3 characters

// Compute filtered coupon suggestions based on input
const suggestions = computed(() => {
    const query = newItem.value.trim().toLowerCase();
    if (query.length < minSuggestionLength) return [];
    return coupons.value.filter(coupon =>
        coupon.title?.toLowerCase().includes(query) ||
        coupon.description?.toLowerCase().includes(query) ||
        coupon.category?.toLowerCase().includes(query) ||
        coupon.disclaimer?.toLowerCase().includes(query) ||
        coupon.to_date?.toLowerCase().includes(query) ||
        coupon.subtitle?.toLowerCase().includes(query)
    );
});

// Add a coupon suggestion to list: clip via API, update local clipped set, and show toast
async function addSuggestion(coupon) {
    if (TokenStorage.hasTokens()) {
        try {
            await CouponsApi.clipCoupon(coupon.id);
            addClippedCoupon(coupon.id);
        } catch (e) {
            console.error('Error clipping coupon:', e);
        }
    }
    items.value.push({
        text: coupon.subtitle,
        helperText: coupon.description,
        badgeText: coupon.title,
        id: Date.now(),
        removing: false
    });
    newItem.value = '';
    addedText.value = coupon.subtitle;
    showAddToast.value = true;
}

// Sort current list alphabetically
function sortItems() {
    items.value.sort((a, b) => a.text.localeCompare(b.text));
}

// Clear the grocery list and show confirmation toast
function clearList() {
    console.log('Clear List action invoked');
    items.value = [];
    window.localStorage.setItem('grocery-items', JSON.stringify([]));
    showClearToast.value = true;
    showClearAlert.value = false;
}

watch(items, (val) => {
    localStorage.setItem('grocery-items', JSON.stringify(val));
}, { deep: true });

// Add custom list item when no suggestion used
function addItem() {
    const text = newItem.value && newItem.value.trim();
    if (!text) return;
    items.value.push({ text, id: Date.now(), removing: false });
    newItem.value = '';
    addedText.value = text;
    showAddToast.value = true;
}

// Immediately remove item from list
function removeItem(item) {
    const index = items.value.findIndex(i => i.id === item.id);
    if (index > -1) {
        items.value.splice(index, 1);
    }
}

// Fade out and remove when checkbox toggled
function removeViaCheckbox(item) {
    item.removing = true;
    setTimeout(() => {
        const index = items.value.findIndex(i => i.id === item.id);
        if (index > -1) items.value.splice(index, 1);
    }, 1000);
}

// Clear all toasts when leaving the GroceryList page
onBeforeRouteLeave((to, from, next) => {
  showEmptyToast.value = false;
  showAddToast.value = false;
  showSortToast.value = false;
  showClearToast.value = false;
  next();
});
</script>

<style scoped>
/* Layout for search bar alignment */
.app-search-container {
    display: flex;
    align-items: center;
}

.app-search-container .app-custom-search-icon {
    margin-right: 8px;
    flex-shrink: 0;
}

ion-checkbox::part(container) {
    border-radius: 500px;
    border: 2px solid;
    border-color: var(--ion-color-primary);
}

.toolbar-icon {
    font-size: 20px !important;
}

/* Transition styles for list removal animation */
.list-leave-active {
    transition: all 0.5s ease;
}

.list-leave-to {
    opacity: 0;
    height: 0;
    margin: 0;
    padding: 0;
}

.grocery-item {
    text-transform: capitalize;
    display: inline-block;
    white-space: nowrap;            /* Prevents wrapping */
    overflow: hidden;               /* Hides overflow content */
    text-overflow: ellipsis;        /* Adds ellipsis (...) when content overflows */
    max-width: 22ch;                /* Limits to approximately 20 characters */
}

ion-toast.custom-toast {
    --background: var(--ion-color-danger);
    --box-shadow: 3px 3px 10px 0 rgba(0, 0, 0, 0.2);
    --color: var(--ion-color-light);
}

ion-toast.success-toast {
    --background: var(--ion-color-success);
    --box-shadow: 3px 3px 10px 0 rgba(0, 0, 0, 0.2);
    --color: var(--ion-color-light);
}

.suggestion-list {
    width: 100%;
    margin-top: 4px;
    --background: var(--ion-color-light);
}

.fade-out {
    opacity: 0;
    transition: opacity 1s ease;
}

/* Truncate long descriptions/helper text */
.suggestion-description,
.helper-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0;
}

/* Optional: adjust h3/p font sizes */
.suggestion-list h3,
.grocery-item {
    font-size: 16px;
    margin: 0;
}

.suggestion-description,
.helper-text {
    font-size: 14px;
    text-transform: uppercase;
}

ion-item {
  position: relative;
}
.coupon-savings-badge {
  font-size: 12px;
  color: var(--ion-color-light);
  position: absolute;
  right: 15px;
  /* top: 8px;
  padding-top: 4px;
  padding-bottom: 4px; */
  display: flex;
  align-items: center;
  text-transform: uppercase;
  vertical-align: middle;
}

.coupon-savings-badge-suggest {
  font-size: 12px;
  color: var(--ion-color-light);
  position: absolute;
  right: 15px;
  top: 8px;
  padding-top: 4px;
  padding-bottom: 4px;
  display: flex;
  align-items: center;
  text-transform: uppercase;
}



</style>