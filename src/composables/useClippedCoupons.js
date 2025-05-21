import { ref, watch, onMounted, onUnmounted } from 'vue';
import CouponsApi from '@/axios/apiCoupons';

// Initialize with stored coupons or empty array
const storedCoupons = localStorage.getItem('clippedCoupons');
const clippedCoupons = ref(new Set(storedCoupons ? JSON.parse(storedCoupons) : []));

// State for error alert
const showErrorAlert = ref(false);
const errorMessage = ref('This coupon is no longer available!');

// Persist changes to localStorage
watch(() => Array.from(clippedCoupons.value), (newValue) => {
  localStorage.setItem('clippedCoupons', JSON.stringify(newValue));
}, { deep: true });

export function useClippedCoupons() {
  // Set up event listeners for coupon errors
  onMounted(() => {
    window.addEventListener('couponError', handleCouponError);
  });

  onUnmounted(() => {
    window.removeEventListener('couponError', handleCouponError);
  });

  const handleCouponError = (event) => {
    errorMessage.value = event.detail?.message || 'This coupon is no longer available!';
    showErrorAlert.value = true;
  };
  
  const closeErrorAlert = () => {
    showErrorAlert.value = false;
  };
  const addClippedCoupon = (couponId) => {
    if (!clippedCoupons.value.has(couponId)) {
      // Create a new Set to trigger reactivity
      const newSet = new Set(Array.from(clippedCoupons.value));
      newSet.add(couponId);
      clippedCoupons.value = newSet;
    }
  };

  const removeClippedCoupon = (couponId) => {
    if (clippedCoupons.value.has(couponId)) {
      // Create a new Set to trigger reactivity
      const newSet = new Set(Array.from(clippedCoupons.value));
      newSet.delete(couponId);
      clippedCoupons.value = newSet;
    }
  };

  const isCouponClipped = (couponId) => {
    return clippedCoupons.value.has(couponId);
  };

  // Verify if a coupon is still valid by checking the API
  const verifyCouponValidity = async (couponId) => {
    try {
      const response = await CouponsApi.getCouponById(couponId);
      // If we get a response with data, the coupon is still valid
      return !!(response?.data?.[0] || response?.data?.data?.[0]);
    } catch (error) {
      console.error('Error verifying coupon validity:', error);
      return false;
    }
  };

  // Clean up expired coupons by checking each one against the API
  const cleanupExpiredCoupons = async () => {
    const currentClipped = Array.from(clippedCoupons.value);
    const validCoupons = new Set();

    // Check each coupon's validity
    for (const couponId of currentClipped) {
      const isValid = await verifyCouponValidity(couponId);
      if (isValid) {
        validCoupons.add(couponId);
      }
    }

    // Update clipped coupons if any were removed
    if (validCoupons.size !== clippedCoupons.value.size) {
      clippedCoupons.value = validCoupons;
    }
  };

  // Sync clipped coupons - now just adds new ones without removing
  const syncClippedCoupons = (availableCoupons) => {
    if (!availableCoupons || !Array.isArray(availableCoupons)) return;

    // Only add new coupons that are clipped, don't remove any
    const newCouponIds = availableCoupons
      .filter(coupon => isCouponClipped(coupon.id))
      .map(coupon => coupon.id);

    if (newCouponIds.length > 0) {
      const newSet = new Set([...clippedCoupons.value, ...newCouponIds]);
      if (newSet.size !== clippedCoupons.value.size) {
        clippedCoupons.value = newSet;
      }
    }
  };

  return {
    clippedCoupons,
    addClippedCoupon,
    removeClippedCoupon,
    isCouponClipped,
    syncClippedCoupons,
    cleanupExpiredCoupons,
    showErrorAlert,
    errorMessage,
    closeErrorAlert
  };
} 