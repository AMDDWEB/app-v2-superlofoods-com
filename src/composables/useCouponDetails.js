import { ref, computed } from 'vue'
import CouponsApi from '@/axios/apiCoupons'

const coupons = ref([]);
const loading = ref(false);
const categories = ref([]);
const selectedSort = ref('newest');
const allCoupons = ref([]);
const isMidax = ref(import.meta.env.VITE_HAS_MIDAX_COUPONS === "true");
const categoryMap = ref({}); // Store mapping between category names and IDs

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

      // First, make sure we have categories loaded
      if (Object.keys(categoryMap.value).length === 0) {
        await fetchCategories();
      }

      const response = await CouponsApi.getCoupons({
        limit,
        offset,
        category,
        category_id,
        sortBy: selectedSort.value
      });
      
      // Get all category data to map IDs to names
      const categoryData = await fetchCategories();
      
      // Create a reverse lookup map (ID -> Name)
      const idToNameMap = {};
      categoryData.forEach(cat => {
        idToNameMap[cat.Id] = cat.Name;
      });
      
      // If category_id is provided, use that for the category name
      let selectedCategoryName = null;
      if (category_id && idToNameMap[category_id]) {
        selectedCategoryName = idToNameMap[category_id];
      }
      
      // Add category_name to each coupon based on its category_id
      if (response.items && response.items.length > 0) {
        response.items = response.items.map(coupon => {
          // Try to get the actual category name from the coupon's category_id
          let couponCategoryName = 'Coupon';
          
          // First priority: use the selected category if this was a filtered request
          if (selectedCategoryName) {
            couponCategoryName = selectedCategoryName;
          }
          // Second priority: if the coupon has a category_id, look it up
          else if (coupon.category_id && idToNameMap[coupon.category_id]) {
            couponCategoryName = idToNameMap[coupon.category_id];
          }
          // Third priority: use existing category_name if present
          else if (coupon.category_name) {
            couponCategoryName = coupon.category_name;
          }
          
          return {
            ...coupon,
            category_name: couponCategoryName
          };
        });
      }

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
      
      // Build mapping between category names and IDs
      const categoryMapping = {};
      categoriesResponse.forEach(category => {
        categoryMapping[category.Name] = category.Id;
      });
      categoryMap.value = categoryMapping;
      
      // Extract category names from the API response
      const categoryNames = categoriesResponse.map(category => category.Name);
      
      // Set categories with 'All Coupons' first, then the API categories
      categories.value = ['All Coupons', ...categoryNames];
      
      return categoryData;
      
    } catch (error) {
      console.error('Error fetching categories:', error);
      categories.value = ['All Coupons'];
      return [];
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
        const response = await fetchCoupons({
          limit,
          offset,
          category_id: weeklySpecialsCategory.Id
        });
        
        // Add the category_name to each coupon object
        if (response.items && response.items.length > 0) {
          response.items = response.items.map(coupon => ({
            ...coupon,
            category_name: 'Weekly Specials'
          }));
        }
        
        return response;
      } else {
        console.warn('Weekly Specials category not found');
        return { items: [] };
      }
    } catch (error) {
      console.error('Error fetching Weekly Specials coupons:', error);
      return { items: [] };
    }
  };

  const fetchCouponsByCategory = async (categoryName, limit = isMidax.value ? 20 : 1000, offset = 0) => {
    try {
      // Make sure categoryMap is populated
      if (Object.keys(categoryMap.value).length === 0) {
        await fetchCategories();
      }
      
      // If this is "All Coupons" or an unknown category, fetch without filtering
      if (categoryName === 'All Coupons' || !categoryMap.value[categoryName]) {
        return await fetchCoupons({ limit, offset });
      }
      
      // Otherwise, fetch using the category ID
      const categoryId = categoryMap.value[categoryName];
      
      // The fetchCoupons function will handle adding category names to the coupon objects
      return await fetchCoupons({
        limit,
        offset,
        category_id: categoryId
      });
    } catch (error) {
      console.error(`Error fetching coupons for category ${categoryName}:`, error);
      return { items: [] };
    }
  };

  return {
    coupons,
    loading,
    fetchCoupons,
    fetchCategories,
    fetchWeeklySpecialsCoupons,
    fetchCouponsByCategory,
    categories,
    selectedSort,
    allCoupons,
    availableCategories,
    categoryMap,
    isMidax
  };
} 