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
      // Fetch categories from the API endpoint
      const categoriesResponse = await CouponsApi.getCategories();
      
      // Extract category names from the API response
      const categoryNames = categoriesResponse.map(category => category.Name);
      
      // Set categories with 'All Coupons' first, then the API categories
      categories.value = ['All Coupons', ...categoryNames];
      
    } catch (error) {
      console.error('Error fetching categories:', error);
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