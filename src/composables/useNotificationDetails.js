export function useNotificationDetails() {
    const transformNotificationData = (notification = {}) => {
        return {
            notification_title: notification.title,
            notification_details: notification.details,
            notification_end_date: notification.end_date,
        };
    };

    const transformAllNotifications = (notifications = []) => {
        return notifications.map(transformNotificationData);
    };

    return {
        transformNotificationData,
        transformAllNotifications, // Added to the returned object
    };
}