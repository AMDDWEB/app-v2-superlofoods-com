<template>
  <ion-card class="ion-no-margin ion-no-padding" v-for="i in count" :key="i">
    <div class="ion-padding-top skeleton-image-container">
      <ion-skeleton-text animated class="skeleton-image">
      </ion-skeleton-text>
    </div>

    <div class="skeleton-content">
      <ion-skeleton-text animated class="skeleton-brand">
      </ion-skeleton-text>

      <ion-skeleton-text animated class="skeleton-title">
      </ion-skeleton-text>

      <ion-skeleton-text animated class="skeleton-description">
      </ion-skeleton-text>

      <ion-skeleton-text animated class="skeleton-expiration">
      </ion-skeleton-text>

      <ion-skeleton-text animated class="skeleton-button">
      </ion-skeleton-text>
    </div>
  </ion-card>
</template>

<script setup>
import { IonCard, IonSkeletonText } from '@ionic/vue';

defineProps({
  count: {
    type: Number,
    default: 3
  }
});
</script>

<style scoped>
ion-card {
  margin: 4px;
  background: var(--ion-color-light-tint);
  box-shadow: none;
  height: 300px;
}

ion-skeleton-text {
  border-radius: 4px;
}

.skeleton-image-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.skeleton-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 16px;
}

.skeleton-image {
  width: 80%;
  height: 100px;
}

.skeleton-brand {
  width: 90%;
}

.skeleton-title {
  width: 70%;
  margin: 5px 0;
}

.skeleton-description {
  width: 100%;
  height: 40px;
  margin: 5px 0;
}

.skeleton-expiration {
  width: 40%;
  margin: 5px 0;
}

.skeleton-button {
  width: 100%;
  height: 32px;
  margin: 5px 0;
}
</style>