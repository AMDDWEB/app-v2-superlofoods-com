import OneSignal from 'onesignal-cordova-plugin';

export function useNotifications(user) {
  const requestNotificationPermission = async () => {
    try {
      if (!OneSignal || !OneSignal.Notifications) return;
      return await OneSignal.Notifications.requestPermission();
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const setNotificationTags = async (tagsOverride) => {
    try {
      if (!OneSignal || !OneSignal.User) return;

      const derivedTags = {};
      if (user && user.email) derivedTags.user_email = String(user.email).toLowerCase();
      if (user && user.location) derivedTags.user_location = String(user.location);

      const finalTags = tagsOverride && Object.keys(tagsOverride).length > 0
        ? tagsOverride
        : derivedTags;

      if (!finalTags || Object.keys(finalTags).length === 0) return;

      await OneSignal.User.addTags(finalTags);
    } catch (error) {
      console.error('Error setting OneSignal tags:', error);
    }
  };

  return {
    requestNotificationPermission,
    setNotificationTags
  };
}