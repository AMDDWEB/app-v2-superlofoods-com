import { ref, computed } from 'vue'
import Coupons from '@/axios/apiCoupons'

const coupons = ref([]);
const loading = ref(false);
const categories = ref([]);
// Preserve full category objects from the API for ID lookups
const categoriesData = ref([]);
const selectedSort = ref('newest');
const allCoupons = ref([]);
const isMidax = ref(import.meta.env.VITE_HAS_MIDAX_COUPONS === "true");
const weeklySpecialsCategory = ref(null);

export function useCouponDetails() {
  const fetchCoupons = async ({
    limit = isMidax.value ? 20 : 1000,
    offset = 0,
    category = null,
    manageLoading = true,
    skipState = false
  } = {}) => {
    try {
      if (manageLoading && offset === 0) {
        loading.value = true;
      }

      const locationId = localStorage.getItem('storeId');
      if (!locationId) {
        throw new Error('No store ID found in localStorage');
      }
      let params = {
        limit,
        offset,
        location_id: locationId,
        sort_by: selectedSort.value
      }
      if( localStorage.getItem('CardNumber') ) {
        params.card_number = localStorage.getItem('CardNumber')
      }
      if (category) params.category_id = category.Id

      const response = await Coupons.getCoupons(
        params
      );

      if (!skipState) {
        if (offset === 0) {
          // Reset coupons if this is the first batch
          coupons.value = response.data?.items || response.data || [];
        } else if (isMidax.value) {
          // Append new coupons only for Midax, ensuring no duplicates
          const newCoupons = response.data?.items || response.data || [];
          const existingIds = new Set(coupons.value.map(coupon => coupon.id));
          const uniqueNewCoupons = newCoupons.filter(coupon => !existingIds.has(coupon.id));
          coupons.value = [...coupons.value, ...uniqueNewCoupons];
        }
      }

      return response;
    } catch (error) {
      console.error('Error fetching coupons:', error);
      return { data: { items: [] } };
    } finally {
      if (manageLoading && offset === 0) {
        loading.value = false;
      }
    }
  };

  const fetchCategories = async () => {
    try {
      const locationId = localStorage.getItem('storeId');
      if (!locationId) {
        throw new Error('No store ID found in localStorage');
      }
      
      // Fetch categories from the API endpoint
      const categoriesResponse = await Coupons.getCouponCategories(locationId);
      
      if (categoriesResponse.data && Array.isArray(categoriesResponse.data)) {
        // Keep raw data for lookups
        categoriesData.value = categoriesResponse.data;
        // Find the Weekly Specials category
        const weeklySpecials = categoriesResponse.data.find(
          cat => cat.Name.toLowerCase().includes('weekly') || cat.Name.toLowerCase().includes('specials')
        );
        
        if (weeklySpecials) {
          weeklySpecialsCategory.value = weeklySpecials;
        }
        
        // Extract category names from the API response
        const categoryNames = categoriesResponse.data.map(category => category.Name);
        
        // Set categories with 'All Coupons' first, then the API categories
        categories.value = ['All Coupons', ...categoryNames];
      } else {
        console.warn('Unexpected categories response format:', categoriesResponse);
        categories.value = ['All Coupons'];
        categoriesData.value = [];
      }
      
    } catch (error) {
      console.error('Error fetching categories:', error);
      categories.value = ['All Coupons'];
      categoriesData.value = [];
    }
  };

  const availableCategories = computed(() => categories.value);

  // Helper to look up category object (for server-side filtering by ID)
  const getCategoryByName = (name) => {
    if (!name || name === 'All Coupons') return null;
    return categoriesData.value.find(cat => cat.Name === name) || null;
  };

  // Function to fetch weekly specials using the stored category ID
  const fetchWeeklySpecials = async (limit = 10, offset = 0) => {
    if (!weeklySpecialsCategory.value) {
      await fetchCategories(); // Make sure we have the latest categories
    }
    
    if (weeklySpecialsCategory.value) {
      return await fetchCoupons({
        limit,
        offset,
        category: weeklySpecialsCategory.value
      });
    }
    
    // Fallback to regular coupons if no weekly specials category found
    return await fetchCoupons({ limit, offset });
  };

  return {
    coupons,
    loading,
    fetchCoupons,
    fetchCategories,
    fetchWeeklySpecials,
    availableCategories,
    isMidax,
    weeklySpecialsCategory: computed(() => weeklySpecialsCategory.value),
    getCategoryByName
  };
} 