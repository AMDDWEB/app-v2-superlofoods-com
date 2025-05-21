// Declare cordova on window object for TypeScript
declare global {
  interface Window {
    cordova: any;
  }
}

import { createApp } from 'vue'
import App from './App.vue'
import router from './router';
import { createAuth0 } from '@auth0/auth0-vue';
import { isPlatform } from '@ionic/vue'
import { IonicVue } from '@ionic/vue';

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* @import '@ionic/vue/css/palettes/dark.always.css'; */
/* @import '@ionic/vue/css/palettes/dark.class.css'; */
/* import '@ionic/vue/css/palettes/dark.system.css'; */

/* Theme variables */
import './theme/variables.css';

/* Custom icons */
import { registerCustomIcons } from './composables/useCustomIcons';
import { useNotifications } from './composables/useNotifications';

registerCustomIcons();

/* One Signal push notification integration  */
import OneSignal from 'onesignal-cordova-plugin';

// Auth0 Configuration
const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN
const auth0ClientId = import.meta.env.VITE_AUTH0_CLIENT_ID
const appId = import.meta.env.VITE_APP_ID

export const callbackUri = isPlatform('hybrid')
  ? `${appId}://${auth0Domain}/capacitor/${appId}/callback`
  : 'http://localhost:8100'

const app = createApp(App)
  .use(IonicVue)
  .use(router)
  .use(
    createAuth0({
      domain: auth0Domain,
      clientId: auth0ClientId,
      authorizationParams: {
        redirect_uri: callbackUri,
        audience: 'midax-api'
      },
      useRefreshTokens: true,
      useRefreshTokensFallback: false
    })
  );

// Provide the notification permission function
const { requestNotificationPermission } = useNotifications();
app.provide('requestNotificationPermission', requestNotificationPermission);

router.isReady().then(() => {
  app.mount('#app');
  
  // Initialize OneSignal with the environment variable
  OneSignal.initialize(import.meta.env.VITE_ONESIGNAL_APP_ID);
  
  // Request permission for notifications
  OneSignal.Notifications.requestPermission()
    .then((response) => {
      console.log('Push notification permission response:', response);
    });
});