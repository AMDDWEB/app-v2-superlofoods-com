import axios from 'axios';
import { TokenStorage } from '../utils/tokenStorage';
import { alertController } from '@ionic/vue';

let couponsInstance;

class CouponsApi {
  constructor() {
    const base = axios.create({
      baseURL: import.meta.env.VITE_COUPONS_API,
      headers: {
        'Content-type': 'application/json',
        'x-api-key': import.meta.env.VITE_COUPONS_API_KEY,
        'Accept': '*/*'
      }
    });
    couponsInstance = base;
  }

  async getCategories() {
    const response = await couponsInstance({
      url: '/categories',
      method: 'GET',
      params: {
        merchant_id: import.meta.env.VITE_COUPONS_MERCHANT_ID
      }
    });
    return response.data;
  }

  async getCoupons({
    limit = 1000,
    offset = 0,
    category = null,
    sortBy = 'expires'
  } = {}) {
    const hasMidaxCoupons = import.meta.env.VITE_HAS_MIDAX_COUPONS === "true";
    const params = {
      sort_by: 'expires'
    };

    if (hasMidaxCoupons) {
      // For Midax system - always use batch loading with fixed limit
      params.location_id = localStorage.getItem('storeId');
      params.limit = '25'; // Fixed limit for Midax
      params.offset = offset.toString();
      
      // Only add card number if authenticated - check both formats
      const cardNumber = localStorage.getItem('CardNumber') || localStorage.getItem('cardNumber');
      if (cardNumber) {
        params.Card_number = cardNumber;
      }
    } else {
      // For AppCard system - load all at once
      params.merchant_id = import.meta.env.VITE_COUPONS_MERCHANT_ID;
      params.limit = limit.toString();
      
      // Only add refresh token if authenticated
      const refreshToken = TokenStorage.getRefreshToken();
      if (refreshToken) {
        params.refresh_token = refreshToken;
      }
    }

    const response = await couponsInstance({
      url: '/offers',
      method: 'GET',
      params
    });

    return {
      ...response.data,
      hasMidaxCoupons // Add this flag to response to handle pagination appropriately
    };
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
      let cardNumber = localStorage.getItem('CardNumber');
      if (!cardNumber) {
        cardNumber = localStorage.getItem('cardNumber');
      }
      const storeId = localStorage.getItem('storeId');
      
      console.log('Clipping coupon with card_number:', cardNumber);
      
      if (!cardNumber || !storeId) {
        throw new Error('Missing required Midax parameters');
      }
      
      // First fetch the coupon details to get the provider
      try {
        const couponResponse = await this.getCouponById(offerId);
        let couponData = null;
        
        // Extract coupon data based on response structure
        if (couponResponse.data && Array.isArray(couponResponse.data)) {
          couponData = couponResponse.data[0];
        } else if (couponResponse.data?.data && Array.isArray(couponResponse.data.data)) {
          couponData = couponResponse.data.data[0];
        }
        
        console.log('Coupon data for clip:', couponData);
        
        // Get provider from coupon data or default to "QUOT"
        const provider = couponData?.provider || "QUOT";
        console.log('Using provider:', provider, 'for coupon ID:', offerId);
        
        // For Midax, use the correct format with card_number as a parameter
        const options = {
          method: 'PUT',
          url: '/clip-coupon',
          params: {
            card_number: cardNumber
          },
          data: JSON.stringify({
            offer_id: offerId.toString(),
            app_id: import.meta.env.VITE_APP_ID,
            provider: provider
          })
        };

        const response = await couponsInstance.request(options);
        return response.data;
      } catch (error) {
        console.error('Error clipping coupon:', error.response?.data);
        this.showErrorDialog('This coupon is no longer available or has reached its maximum usage.');
        throw error;
      }
    } else if (hasAppCardCoupons) {
      // For AppCard system
      const params = {
        offer_id: offerId,
        merchant_id: import.meta.env.VITE_COUPONS_MERCHANT_ID,
        refresh_token: TokenStorage.getRefreshToken()
      };

      try {
        const response = await couponsInstance({
          url: '/clip-coupon',
          method: 'PUT',
          params
        });
        return response.data;
      } catch (error) {
        console.error(error);
        this.showErrorDialog('This coupon is no longer available or has reached its maximum usage.');
        throw error;
      }
    } else {
      throw new Error('No valid coupon system configuration found');
    }
  }

  async getCouponById(id) {
    const hasMidaxCoupons = import.meta.env.VITE_HAS_MIDAX_COUPONS === "true";

    const params = {
      offer_id: id
    };

    if (hasMidaxCoupons) {
      // Use store_id for Midax system
      const storeId = localStorage.getItem('storeId');
      if (!storeId) {
        throw new Error('Missing store ID for Midax system');
      }
      params.location_id = storeId;
    } else {
      // Use merchant_id for App Card system
      params.merchant_id = import.meta.env.VITE_COUPONS_MERCHANT_ID;
    }

    return await couponsInstance({
      url: '/get-offer-by-id',
      method: 'GET',
      params
    });
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
