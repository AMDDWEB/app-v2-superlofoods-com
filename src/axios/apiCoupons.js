import axios from 'axios';
import { TokenStorage } from '../utils/tokenStorage';
import { alertController } from '@ionic/vue';

let couponsInstance;

class CouponsApi {
  constructor() {
    // Store environment check result as a class property
    this.hasMidaxCoupons = import.meta.env.VITE_HAS_MIDAX_COUPONS === "true";
    
    const base = axios.create({
      baseURL: import.meta.env.VITE_COUPONS_API,
      withCredentials: false,
      headers: {
        'Content-type': 'application/json',
        'x-api-key': import.meta.env.VITE_COUPONS_API_KEY,
        'Accept': '*/*'
      }
    });
    couponsInstance = base;
  }

  /**
   * Fetches coupon categories based on the active system:
   * - Midax: Requires store location and uses card-based authentication
   * - AppCard: Uses merchant-based authentication without store location
   * @returns {Promise<Object>} Categories data
   */
  async getCategories() {
    if (this.hasMidaxCoupons) {
      const locationId = localStorage.getItem('storeId');
      
      if (!locationId) {
        throw new Error('No store ID found in localStorage');
      }
      
      // Get card number from localStorage, consistent with clipCoupon method
      let cardNumber = localStorage.getItem('CardNumber');
      if (!cardNumber) {
        cardNumber = localStorage.getItem('cardNumber');
      }
      
      const response = await couponsInstance({
        url: '/categories',
        method: 'GET',
        params: { 
          location_id: locationId, 
          card_number: cardNumber || '1234' // Fallback if no card number found
        }
      });
      
      return response.data;
    } else {
      // For AppCard system
      const response = await couponsInstance({
        url: '/categories',
        method: 'GET',
        params: {
          merchant_id: import.meta.env.VITE_COUPONS_MERCHANT_ID
        }
      });
      
      return response.data;
    }
  }

  async getCouponById(locationId, offerId) {
    const hasMidaxCoupons = import.meta.env.VITE_HAS_MIDAX_COUPONS === "true";

    if (hasMidaxCoupons) {
      // Use store_id for Midax system
      if (!locationId) {
        locationId = localStorage.getItem('storeId');
        if (!locationId) {
          throw new Error('Missing store ID for Midax system');
        }
      }
      
      return await couponsInstance({
        url: '/offer-by-id',
        method: 'GET',
        params: {
          location_id: locationId,
          offer_id: offerId
        }
      });
    } else {
      // Use merchant_id for App Card system
      return await couponsInstance({
        url: '/get-offer-by-id',
        method: 'GET',
        params: {
          merchant_id: import.meta.env.VITE_COUPONS_MERCHANT_ID,
          offer_id: offerId
        }
      });
    }
  }

  async getCoupons({
    limit = 25,
    offset = 0,
    category = null,
    sortBy = 'expires'
  } = {}) {
    const hasMidaxCoupons = import.meta.env.VITE_HAS_MIDAX_COUPONS === "true";
  
    if (hasMidaxCoupons) {
      // For Midax system
      const locationId = localStorage.getItem('storeId');
      if (!locationId) {
        throw new Error('No store ID found in localStorage');
      }
      
      let params = {
        offset,
        limit,
        location_id: locationId,
        sort_by: sortBy
      };
      
      if (category) {
        params.category_id = category.Id;
      }
      
      const response = await couponsInstance({
        url: `/offers`,
        method: 'GET',
        params: params
      });
      
      return {
        ...response.data,
        hasMidaxCoupons // Add this flag to response to handle pagination appropriately
      };
    } else {
      // For AppCard system - load all at once
      const params = {
        merchant_id: import.meta.env.VITE_COUPONS_MERCHANT_ID,
        limit: limit.toString(),
        sort_by: sortBy
      };
      
      // Only add refresh token if authenticated
      const refreshToken = TokenStorage.getRefreshToken();
      if (refreshToken) {
        params.refresh_token = refreshToken;
      }
      
      const response = await couponsInstance({
        url: '/offers',
        method: 'GET',
        params
      });
      
      return {
        ...response.data,
        hasMidaxCoupons
      };
    } 
  }

  async startCouponSignup(phoneNumber) {
    return await couponsInstance({
      url: '/start',
      method: 'POST',
      data: {
        deliveryMethod: "text",
        phoneNumber: `+1${phoneNumber}`,
        IsoCountryCode: "US"
      }
    });
  }

  async verifyCode(data) {
    return await couponsInstance({
      url: '/verify',
      method: 'POST',
      data: {
        phoneNumber: data.phoneNumber,
        pinCode: data.pinCode,
        IsoCountryCode: "US",
        merchantId: import.meta.env.VITE_COUPONS_MERCHANT_ID
      }
    });
  }

  async clipCoupon(offerId, cardNumber) {
    const hasMidaxCoupons = import.meta.env.VITE_HAS_MIDAX_COUPONS === "true";
    const hasAppCardCoupons = import.meta.env.VITE_HAS_APPCARD_COUPONS === "true";

    if (hasMidaxCoupons) {
      // Try both casing variants since there's inconsistency in the codebase
      if (!cardNumber) {
        cardNumber = localStorage.getItem('CardNumber');
        if (!cardNumber) {
          cardNumber = localStorage.getItem('cardNumber');
        }
      }
      
      console.log('Clipping coupon with card_number:', cardNumber);
      
      if (!cardNumber) {
        throw new Error('Missing required Midax parameters');
      }
      
      try {
        // For Midax, use the POST format
        const coupon = {
          offer_id: offerId.toString(),
          app_id: import.meta.env.VITE_APP_ID,
          provider: "QUOT" // Default provider
        };
        
        const response = await couponsInstance({
          url: `/offer/${cardNumber}`,
          method: 'POST',
          data: coupon
        });
        return response.data;
      } catch (error) {
        console.error('Error clipping coupon:', error.response?.data);
        this.showErrorDialog('This coupon is no longer available or has reached its maximum usage.');
        throw error;
      }
    } else {
      throw new Error('No valid coupon system configuration found');
    }
  }

  /**
   * Get coupon by ID - this method replaces the duplicate implementation
   * to ensure consistent behavior across the application
   * @param {string|number} id - The offer ID to retrieve
   * @param {string|number} [locationId=null] - Optional location ID (will use localStorage if not provided)
   * @returns {Promise<Object>} Coupon data
   */
  async getCouponById(id, locationId = null) {
    // Using class property instead of re-evaluating environment variable
    
    if (this.hasMidaxCoupons) {
      // Use store_id for Midax system
      if (!locationId) {
        locationId = localStorage.getItem('storeId');
        if (!locationId) {
          throw new Error('Missing store ID for Midax system');
        }
      }
      
      return await couponsInstance({
        url: '/offer-by-id',
        method: 'GET',
        params: {
          location_id: locationId,
          offer_id: id
        }
      });
    } else {
      // Use merchant_id for App Card system
      return await couponsInstance({
        url: '/get-offer-by-id',
        method: 'GET',
        params: {
          merchant_id: import.meta.env.VITE_COUPONS_MERCHANT_ID,
          offer_id: id
        }
      });
    }
  }

  async getCustomerInfo() {
    const refreshToken = TokenStorage.getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token found');
    }

    const response = await couponsInstance({
      url: '/customer',
      method: 'GET',
      params: {
        merchant_id: import.meta.env.VITE_COUPONS_MERCHANT_ID,
        refresh_token: refreshToken
      }
    });

    return response.data;
  }

  async updateUserProfile(userProfile, refreshToken) {
    const data = {
      mini_site_additional_data: {
        Name: {
          "First Name": userProfile.firstName || '',
          "Last Name": userProfile.lastName || ''
        },
        Email: userProfile.email || '',
        Birthday: userProfile.birthday || '',
        "Address (full)": {
          Country: userProfile.country || '',
          State: userProfile.state || '',
          City: userProfile.city || '',
          Zip: userProfile.zipCode || '',
          Address1: userProfile.address1 || '',
          Address2: userProfile.address2 || ''
        }
      },
      opt_out_promotion: userProfile.optOutPromotion || false,
      do_not_sell_my_data: userProfile.doNotSellMyData || false
    };

    const response = await couponsInstance({
      url: '/customer',
      method: 'PUT',
      data,
      params: {
        merchant_id: import.meta.env.VITE_COUPONS_MERCHANT_ID,
        refresh_token: refreshToken
      }
    });

    return response.data;
  }

  async getOfferDetails() {
    const refreshToken = TokenStorage.getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token found');
    }

    const response = await couponsInstance({
      url: '/offer-details',
      method: 'GET',
      params: {
        refresh_token: refreshToken
      }
    });

    return response.data;
  }

  isAuthenticated() {
    return TokenStorage.hasTokens();
  }

  async getClippedCoupons(params) {
    return await couponsInstance({
      url: '/card-offers',
      method: 'GET',
      params
    });
  }
  
  // Show error dialog when a coupon is no longer available
  async showErrorDialog(message) {
    const alert = await alertController.create({
      header: 'Notice',
      message: message,
      buttons: [
        {
          text: 'OK',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }
}

export default new CouponsApi();