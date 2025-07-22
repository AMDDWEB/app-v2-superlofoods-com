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
    category = null,
    category_id = null
  } = {}) => {
    try {
      if (offset === 0) {
        loading.value = true;
      }

      const response = await CouponsApi.getCoupons({
        limit,
        offset,
        category,
        category_id,
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
      
      // Store the full category objects for later reference
      const categoryData = categoriesResponse;
      
      // Extract category names from the API response
      const categoryNames = categoriesResponse.map(category => category.Name);
      
      // Set categories with 'All Coupons' first, then the API categories
      categories.value = ['All Coupons', ...categoryNames];
      
      return categoryData;
      
    } catch (error) {
      console.error('Error fetching categories:', error);
      categories.value = ['All Coupons'];
    }
  };

  const availableCategories = computed(() => categories.value);

  const fetchWeeklySpecialsCoupons = async (limit = isMidax.value ? 20 : 1000, offset = 0) => {
    try {
      // First fetch categories to get the Weekly Specials ID
      const categoryData = await fetchCategories();
      
      // Find the Weekly Specials category
      const weeklySpecialsCategory = categoryData.find(cat => cat.Name === 'Weekly Specials');
      
      if (weeklySpecialsCategory) {
        // Use the ID to fetch filtered coupons
        return await fetchCoupons({
          limit,
          offset,
          category_id: weeklySpecialsCategory.Id
        });
      } else {
        console.warn('Weekly Specials category not found');
        return { items: [] };
      }
    } catch (error) {
      console.error('Error fetching Weekly Specials coupons:', error);
      return { items: [] };
    }
  };

  return {
    coupons,
    loading,
    fetchCoupons,
    fetchCategories,
    fetchWeeklySpecialsCoupons,
    categories,
    selectedSort,
    allCoupons,
    availableCategories,
    isMidax
  };
} 