<template>
  <ion-modal 
    :breakpoints="[1]" 
    :is-open="isOpen"
    @didDismiss="closeModal"
    :swipe-to-close="false"
    :backdropDismiss="false"
  >
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ adType }} for {{ formattedStartDate }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="closeModal">Close</ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <div class="pdf-controls">
          <ion-button shape="round" size="small" :disabled="currentPage === 1" @click="handlePreviousPage">
            <ion-icon :icon="chevronBackOutline"></ion-icon>
          </ion-button>

          <div class="pdf-pagination">
            Page {{ currentPage }} of {{ totalPages }}
          </div>

          <ion-button shape="round" size="small" :disabled="currentPage === totalPages" @click="handleNextPage">
            <ion-icon :icon="chevronForwardOutline"></ion-icon>
          </ion-button>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-no-padding pdf-wrapper" :scroll-y="false">

      <!-- PDF Viewer -->
      <div ref="pdfContainer" class="pdf-container">
        <div class="panzoom-content"></div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import Panzoom from '@panzoom/panzoom';
import usePdfViewer from '../composables/usePdfViewer';

const props = defineProps({
  isOpen: Boolean,
  pdfUrl: String,
  adType: { type: String, default: 'Ad' },
  startDate: { type: String, default: '' }
});
const emit = defineEmits(['update:isOpen']);

const pdfContainer = ref(null);
let panzoomInstance = null;

const {
  currentPage,
  totalPages,
  loadPdf,
  initPdfViewer,
  nextPage,
  previousPage
} = usePdfViewer();

const formattedStartDate = computed(() => {
  if (!props.startDate) return '';
  const date = new Date(props.startDate);
  if (isNaN(date)) return '';
  const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
  const day = date.getDate();
  const suffix = (d) => {
    if (d >= 11 && d <= 13) return 'th';
    switch (d % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  return `${month} ${day}${suffix(day)}`;
});

const closeModal = () => {
  if (panzoomInstance) {
    panzoomInstance.destroy();
    panzoomInstance = null;
  }
  emit('update:isOpen', false);
};

const handleNextPage = async () => {
  if (pdfContainer.value) {
    await nextPage(pdfContainer.value.querySelector('.panzoom-content'));
    if (panzoomInstance) panzoomInstance.reset();
  }
};

const handlePreviousPage = async () => {
  if (pdfContainer.value) {
    await previousPage(pdfContainer.value.querySelector('.panzoom-content'));
    if (panzoomInstance) panzoomInstance.reset();
  }
};

watch(() => props.isOpen, async (newVal) => {
  if (newVal && props.pdfUrl) {
    await nextTick();
    const panzoomEl = pdfContainer.value?.querySelector('.panzoom-content');
    if (!panzoomEl) return;

    panzoomEl.innerHTML = '';
    await loadPdf(props.pdfUrl, panzoomEl);

    if (panzoomInstance) {
      panzoomInstance.destroy();
    }

    panzoomInstance = Panzoom(panzoomEl, {
      maxScale: 3,
      minScale: 1,
      contain: 'outside'
    });

    panzoomInstance.reset();

    await nextTick();
    const containerWidth = pdfContainer.value.offsetWidth;
    const canvas = panzoomEl.querySelector('canvas');
    if (canvas && canvas.offsetWidth < containerWidth) {
      const scaleToFit = containerWidth / canvas.offsetWidth;
      panzoomInstance.zoom(scaleToFit, { animate: true });
    }
  }
});

onMounted(() => {
  initPdfViewer();
});
</script>

<style scoped>
.pdf-wrapper {
  --padding-top: 0;
  --padding-bottom: 0;
  --offset-top: auto;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.pdf-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pdf-pagination {
  flex: 1;
  text-align: center;
  font-size: 16px;
  color: var(--ion-color-medium);
}

.pdf-container {
  width: 100%;
  height: 100%;
  overflow: auto;
  touch-action: auto;
  position: relative;
  cursor: grab;
  will-change: transform;
  transform: translateZ(0);
}

.pdf-container:active {
  cursor: grabbing;
}

.pdf-container img,
.pdf-container canvas {
  transform-origin: center;
  transition: transform 0.5s ease-out;
}

.panzoom-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 100px; /* ✅ Extra space below PDF just in case */
}

</style>
