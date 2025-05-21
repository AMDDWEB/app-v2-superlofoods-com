// src/axios/apiRecipes.js

import axios from 'axios';

let recipes;

class RecipesApi {
  constructor() {
    const base = axios.create({
      baseURL: import.meta.env.VITE_DEV_URL,
      withCredentials: false,
      headers: {
        'Content-type': 'application/json'
      }
    });
    recipes = base;
  }

  async getRecipes({ page = 1, perPage = 100 } = {}) {
    try {
      const response = await recipes.get('/wp-json/iproweb/v1/recipes', {
        params: {
          page,
          per_page: perPage
        }
      });
      return response.data;
    } catch (error) {
      return [];
    }
  }
}

export default new RecipesApi();
