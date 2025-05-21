import axios from 'axios';

let notifications;

class NotificationsApi {
  constructor() {
    const base = axios.create({
      baseURL: import.meta.env.VITE_DEV_URL,
      withCredentials: false,
      headers: {
        'Content-type': 'application/json'
      }
    });
    notifications = base;
  }

  async getNotifications() {
    return notifications.get('/wp-json/iproweb/v1/notifications');
  }

  async getNotificationsById(id) {
    const allNotifications = await this.getNotifications();
    return allNotifications.data.find(slider => slider.id.toString() === id.toString());
  }
}

export default new NotificationsApi();