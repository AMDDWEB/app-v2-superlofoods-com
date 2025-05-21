import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import TabsPage from '../views/TabsPage.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/tabs/home'
  },
  {
    path: '/tabs/',
    component: TabsPage,
    children: [
      {
        path: '',
        redirect: '/tabs/home'
      },
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/Home.vue')
      },
      {
        path: 'locations',
        name: 'Locations',
        component: () => import('@/views/Locations.vue')
      },
      {
        path: 'coupons',
        name: 'Coupons',
        component: () => import('@/views/Coupons.vue')
      },
      {
        path: 'recipes',
        name: 'Recipes',
        component: () => import('@/views/Recipes.vue')
      },
      {
        path: 'preferences',
        name: 'Preferences',
        component: () => import('@/views/Preferences.vue')
      }
    ]
  },
  {
    path: '/coupons/:id',
    name: 'CouponDetails',
    component: () => import('@/views/CouponDetails.vue'),
    props: (route) => ({ id: route.params.id }),
    beforeEnter: (to, from, next) => {
      if (!to.params.id) {
        next({ name: 'Coupons' });
      } else {
        next();
      }
    }
  },
  {
    path: '/recipes/:id',
    name: 'RecipeDetails',
    component: () => import('@/views/RecipeDetails.vue'),
    props: (route) => ({ id: route.params.id }),
    beforeEnter: (to, from, next) => {
      if (!to.params.id) {
        next({ name: 'recipes' });
      } else {
        next();
      }
    }
  },
  {
    path: '/locations/:id',
    name: 'LocationDetails',
    component: () => import('@/views/LocationDetails.vue'),
    props: (route) => ({ id: route.params.id }),
    beforeEnter: (to, from, next) => {
      if (!to.params.id) {
        next({ name: 'locations' });
      } else {
        next();
      }
    }
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: () => import('@/views/Notifications.vue'),
  },
  {
    path: '/my-account',
    name: 'My Account',
    component: () => import('@/views/MyAccount.vue'),
  },
  {
    path: '/grocery-list',
    name: 'Grocery List',
    component: () => import('@/views/GroceryList.vue'),
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export default router;