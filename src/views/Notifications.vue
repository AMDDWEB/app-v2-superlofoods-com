<template>
  <ion-page>
    <ion-header>
      <ion-toolbar id="notificationsToolbar">
        <ion-buttons slot="start">
          <ion-button @click="$router.go(-1)">
            <ion-icon slot="icon-only" color="primary" name="back-button" class="toolbar-icon"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Notifications</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Pull-to-Refresh -->
      <ion-refresher slot="fixed" @ionRefresh="doRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Loading State -->
      <div v-if="loading" class="app-loading-container">
        <ion-spinner name="crescent" class="app-loading-spinner"></ion-spinner>
      </div>

      <!-- Notification List -->
      <ion-list v-if="notifications.length > 0" lines="full">
        <ion-item v-for="notification in notifications" :key="notification.id" @click="presentAlert(notification)">
          <!-- Icon Changes Based on isRead -->
          <ion-icon color="secondary" name="notifications-regular" slot="start"></ion-icon>

          <!-- Title and Details Change Based on isRead -->
          <ion-label>
            <h2 class="notification-heading" color="primary">
              {{ notification.notification_title }}
            </h2>
            <p class="app-text-overflow" color="medium">
              {{ notification.notification_details }}
            </p>
            <ion-badge class="notification-badge" color="danger">
              <ion-icon name="trash-notifications-regular" class="badge-icon"></ion-icon> {{ formattedEndDate }}
            </ion-badge>
          </ion-label>
        </ion-item>
      </ion-list>

      <ion-toast
        :is-open="showNoNotificationsToast"
        message="You have no new notifications."
        color="danger"
        position="top"
        duration="6000"
        position-anchor="notificationsToolbar"
        @did-dismiss="resetNoNotificationsToast"
      />
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted, computed, watch, defineComponent } from 'vue';
import apiNotifications from '../axios/apiNotifications';
import { IonPage, IonHeader, IonToolbar, IonContent, IonList, IonItem, IonLabel, IonIcon, IonSpinner, IonRefresher, IonRefresherContent, alertController, IonBadge, IonToast } from '@ionic/vue';
import { useNotificationDetails } from '@/composables/useNotificationDetails';
import { onBeforeRouteLeave } from 'vue-router';

const loading = ref(true);
const notifications = ref([]);
const { transformNotificationData } = useNotificationDetails();

defineComponent({ name: 'NotificationsPage' });

// Fetch notifications logic
const fetchNotifications = async (isRefreshing = false) => {
  if (!isRefreshing) loading.value = true;

  try {
    const response = await apiNotifications.getNotifications();

    const updatedNotifications = response.data.map(notification => {
      return transformNotificationData(notification);
    });

    if (isRefreshing) {
      notifications.value = [...updatedNotifications];
    } else {
      notifications.value = updatedNotifications;
    }

  } catch (error) {
    // Handle error silently or show user feedback
  } finally {
    loading.value = false;
  }
};

// Pull-to-refresh logic
const doRefresh = async (event) => {
  await fetchNotifications(true); // Preserves read state during refresh
  event.target.complete();
};

// Alert presentation and handling
const presentAlert = async (notification) => {
  const alert = await alertController.create({
    header: notification.notification_title,
    message: notification.notification_details,
    buttons: ['OK'] // Only an OK button
  });
  await alert.present();
};

// Computed property for formatted end date
const formattedEndDate = computed(() => {
  if (!notifications.value || notifications.value.length === 0) return ''; // Avoid errors if notifications is empty
  const notification = notifications.value[0]; // Assuming you want to format the first notification's end date
  const endDate = new Date(notification.notification_end_date);

  if (isNaN(endDate)) return ''; // Handle invalid dates

  // Format month name (e.g., "Feb")
  const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(endDate);

  // Get the day and add ordinal suffix (st, nd, rd, th)
  const day = endDate.getDate();
  const dayWithSuffix = addOrdinalSuffix(day);

  return `${month} ${dayWithSuffix}`;
});

// Function to add ordinal suffix
const addOrdinalSuffix = (day) => {
  if (day >= 11 && day <= 13) return `${day}th`; // Special case for 11-13
  switch (day % 10) {
    case 1: return `${day}st`;
    case 2: return `${day}nd`;
    case 3: return `${day}rd`;
    default: return `${day}th`;
  }
};

// Trigger Notifications on Page Load
onMounted(() => {
  fetchNotifications(); // Works for both page reload and revisit
});

// State and reset for no-notifications toast
const showNoNotificationsToast = ref(false);
function resetNoNotificationsToast() {
  showNoNotificationsToast.value = false;
}

// Show toast when loading completes with no notifications
watch(
  () => loading.value,
  (isLoading) => {
    if (!isLoading && notifications.value.length === 0) {
      showNoNotificationsToast.value = true;
    }
  }
);

// Clear the no-notifications toast when navigating away
onBeforeRouteLeave((to, from, next) => {
  showNoNotificationsToast.value = false;
  next();
});
</script>

<style scoped>
.app-text-overflow {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap !important;
}

.app-icon-list-margin {
  margin-right: 5px;
}

.notification-heading {
  font-weight: bold;
  color: var(--ion-color-primary);
}

.notification-badge {
  font-size: 12px;
  color: var(--ion-color-light);
  position: absolute;
  right: 4px;
  top: 0px;
  padding-top: 4px;
  padding-bottom: 4px;
  display: flex;
  align-items: center; /* Ensures both icon and text are vertically centered */
}

.badge-icon {
  margin-right: 4px; /* Adds a small right margin */
  vertical-align: middle; /* Aligns the icon with the text */
}

.ion-item {
  position: relative;
}

ion-list {
  padding: 0;
}

ion-item {
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 12px;
  --padding-bottom: 12px;
}

ion-item:last-of-type {
  --border-width: 0;
}

ion-label {
  margin: 0;
}

ion-label h2 {
  margin-bottom: 4px;
}

ion-label p {
  margin: 0;
  line-height: 1.4;
}

.toolbar-icon {
  font-size: 20px !important;
}

.notification-heading {
  font-weight: bold;
  color: var(--ion-color-primary);
}

.no-notifications {
  text-align: center;
  font-size: 18px;
  color: var(--ion-color-medium);
}

.no-notifications ion-icon {
  font-size: 48px;
  color: var(--ion-color-primary);
  padding-top: 80px;
}

.no-notifications-card {
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

.no-notifications-label {
  color: var(--ion-color-medium);
  font-size: 14px;
  margin-bottom: 4px;
}

.no-notifications-message {
  color: var(--ion-color-dark);
  font-size: 16px;
  font-weight: 600;
}
</style>