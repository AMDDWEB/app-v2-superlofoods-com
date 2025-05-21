import { ref, computed } from 'vue'
import CouponsApi from '@/axios/apiCoupons'

const coupons = ref([]);
const loading = ref(false);
const categories = ref([]);
const selectedSort = ref('newest');
const allCoupons = ref([]);
const isMidax = ref(import.meta.env.VITE_HAS_MIDAX_COUPONS === "true");

export function useCouponDetails() {
  const fetchCoupons = async ({
    limit = isMidax.value ? 20 : 1000,
    offset = 0,
    category = null
  } = {}) => {
    try {
      if (offset === 0) {
        loading.value = true;
      }

      const response = await CouponsApi.getCoupons({
        limit,
        offset,
        category,
        sortBy: selectedSort.value
      });

      if (offset === 0) {
        // Reset coupons if this is the first batch
        coupons.value = response.items || [];
      } else if (isMidax.value) {
        // Append new coupons only for Midax, ensuring no duplicates
        const newCoupons = response.items || [];
        const existingIds = new Set(coupons.value.map(coupon => coupon.id));
        const uniqueNewCoupons = newCoupons.filter(coupon => !existingIds.has(coupon.id));
        coupons.value = [...coupons.value, ...uniqueNewCoupons];
      }

      return response;
    } catch (error) {
      console.error('Error fetching coupons:', error);
      return { items: [] };
    } finally {
      if (offset === 0) {
        loading.value = false;
      }
    }
  };

  const fetchCategories = async () => {
    try {
      // Load initial batch of coupons
      const initialCoupons = await CouponsApi.getCoupons({
        limit: isMidax.value ? 20 : 1000,
        offset: 0
      });

      // Store initial coupons
      allCoupons.value = (initialCoupons.items || []).map(coupon => ({
        ...coupon,
        category: coupon.category || 'Uncategorized'
      }));

      // Extract categories from initial batch
      const categoryCounts = allCoupons.value.reduce((acc, coupon) => {
        const category = coupon.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});

      // Only include categories that have coupons
      const uniqueCategories = Object.entries(categoryCounts)
        .filter(([, count]) => count > 0)
        .map(([category]) => category)
        .sort();

      categories.value = ['All Coupons', ...uniqueCategories];

      // Initialize coupons with initial batch
      coupons.value = allCoupons.value;
    } catch (error) {
      console.error('Error in fetchCategories:', error);
      categories.value = ['All Coupons'];
    }
  };

  const availableCategories = computed(() => categories.value);

  return {
    coupons,
    loading,
    fetchCoupons,
    fetchCategories,
    availableCategories,
    isMidax
  };
} 