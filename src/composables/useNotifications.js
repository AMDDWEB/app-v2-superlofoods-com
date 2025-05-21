export function useNotifications() {
  const requestNotificationPermission = async () => {
    if (window.cordova && window.OneSignal) {
      try {
        const deviceState = await window.OneSignal.getDeviceState();
        if (!deviceState.hasNotificationPermission) {
          await window.OneSignal.promptForPushNotificationsWithUserResponse();
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    }
  };

  return {
    requestNotificationPermission
  };
} 