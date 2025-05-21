import { useAuth0 } from '@auth0/auth0-vue'
import { callbackUri } from '../main'
import { Browser } from '@capacitor/browser'
import { isPlatform } from '@ionic/vue'
import { useRouter } from 'vue-router'

export const useAuthModule = () => {
  const router = useRouter()

  const {
    getAccessTokenSilently,
    handleRedirectCallback,
    isAuthenticated,
    loginWithRedirect,
    logout,
    user
  } = useAuth0()

  const signIn = async () => {
    const accessToken = localStorage.getItem('auth_access_token') || localStorage.getItem('accessToken') || localStorage.getItem('access_token');
    const cardNumber = localStorage.getItem('CardNumber');
    const storeId = localStorage.getItem('storeId');
    
    if (accessToken && (cardNumber || storeId) && isAuthenticated.value) {
      console.log('Already authenticated, skipping login redirect');
      return;
    }
    
    try {
      // Configure browser options based on platform
      const isAndroid = isPlatform('android');

      await loginWithRedirect({
        openUrl: url => {
          const browserConfig = isAndroid
            ? {
                url,
                windowName: '_self'
              }
            : {
                url,
                presentationStyle: 'popover',
                windowName: '_self'
              };
          
          return Browser.open(browserConfig);
        }
      });
    } catch (error) {
      console.error('Authentication error:', error);
      // Handle authentication errors
      // You might want to show a user-friendly error message here
      throw new Error(`Login failed: ${error.message || 'Unknown error'}`);
    }
  }

  const signOut = async () => {
    // Clear all auth-related localStorage items
    localStorage.removeItem('auth_access_token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('CardNumber');
    localStorage.removeItem('firstName');
    
    try {
      const isAndroid = isPlatform('android');

      await logout({
        logoutParams: {
          returnTo: callbackUri
        },
        openUrl: url => {
          const browserConfig = isAndroid
            ? {
                url,
                windowName: '_self'
              }
            : {
                url,
                presentationStyle: 'popover',
                windowName: '_self'
              };
          
          return Browser.open(browserConfig);
        }
      });
      
      // Handle navigation after logout more safely
      if (router.currentRoute.value.path !== '/') {
        router.replace('/');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Force navigation to home page even if logout fails
      router.replace('/');
    }
  }

  // Helper function to store tokens consistently
  const storeAuthToken = (token) => {
    if (!token) return;
    
    // Store with consistent key name
    localStorage.setItem('auth_access_token', token);
    // Keep legacy keys for backward compatibility
    localStorage.setItem('accessToken', token);
  };

  // Enhanced token retrieval with silent refresh capability
  const getAndStoreAccessToken = async () => {
    try {
      const token = await getAccessTokenSilently();
      storeAuthToken(token);
      return token;
    } catch (error) {
      console.error('Failed to get access token silently:', error);
      return null;
    }
  };

  // Handle Android back button for auth flows
  const setupAndroidBackButtonHandler = () => {
    if (!isPlatform('android')) return;

    document.addEventListener('backbutton', (event) => {
      // Only handle back button during authentication flows
      if (window.location.href.includes('auth0') || 
          window.location.href.includes('authorize')) {
        event.preventDefault();
        // Attempt to close the browser
        Browser.close();
      }
    });
  };
  
  // Initialize platform-specific handlers
  if (isPlatform('android')) {
    setupAndroidBackButtonHandler();
  }

  return {
    handleRedirectCallback,
    isAuthenticated,
    getAccessTokenSilently,
    getAndStoreAccessToken,
    signIn,
    signOut,
    user,
    storeAuthToken
  }
}
