import axios from 'axios';

let sliders;

class SlidersApi {
  constructor() {
    const base = axios.create({
      baseURL: import.meta.env.VITE_DEV_URL,
      withCredentials: false,
      headers: {
        'Content-type': 'application/json'
      }
    });
    sliders = base;
  }

  async getSliders() {
    return sliders.get('/wp-json/iproweb/v1/sliders');
  }

  async getSlidersById(id) {
    const allSliders = await this.getSliders();
    return allSliders.data.find(slider => slider.id.toString() === id.toString());
  }
}

export default new SlidersApi();