import axios from 'axios';

let customer;

class Customer {
  constructor() {
    const base = axios.create({
      baseURL: import.meta.env.VITE_COUPONS_API,
      withCredentials: false,
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'x-api-key': import.meta.env.VITE_COUPONS_API_KEY
      }
    });

    // Add request interceptor to handle auth
    base.interceptors.request.use(
      config => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle errors
    base.interceptors.response.use(
      response => response,
      error => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );

    customer = base;
  }

  async checkForExistingUser(storeId) {
    const token = localStorage.getItem('accessToken');
    return customer({
      url: '/check-user',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        location_id: storeId,
        app_id: import.meta.env.VITE_APP_ID
      }
    });
  }

  async updateProfile(profile) {
    return customer({
      url: '/customer',
      method: 'PUT',
      data: {
        AppId: import.meta.env.VITE_APP_ID,
        Id: profile.Id,
        FirstName: profile.FirstName,
        LastName: profile.LastName,
        MiddleName: profile.MiddleName,
        Address1: profile.Address1,
        Address2: profile.Address2,
        City: profile.City,
        State: profile.State,
        Zip: profile.Zip,
        Email: profile.Email,
        Phone: profile.Phone,
        Birthday: profile.Birthday,
        Note: profile.Note,
        Sex: profile.Sex,
        CellPhone: profile.CellPhone,
        ReceiveEmail: profile.ReceiveEmail,
        ReceiveSMS: profile.ReceiveSMS,
        PreferedStore: profile.PreferedStore,
        CardNumber: profile.CardNumber || profile.cardNumber
      }
    });
  }

  async deleteAccount(customerId, appId) {
    return customer({
      url: '/customer',
      method: 'DELETE',
      params: {
        customer_id: customerId,
        app_id: appId
      }
    });
  }
}

export default new Customer();
