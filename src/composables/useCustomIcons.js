// useCustomIcons.js
// Look at maint.ts file for more configs

// Solid icons
import { addIcons } from 'ionicons';
import homeIcon from '../icons/solid/house-solid.svg';
import locationDotIcon from '../icons/solid/location-dot-solid.svg';
import recipesIcon from '../icons/solid/fork-knife-solid.svg';
import moreIcon from '../icons/solid/ellipsis-solid.svg';
import weeklyAdIcon from '../icons/solid/solid-calendar-lines-circle-dollar.svg';
import myStoreIcon from '../icons/solid/cart-circle-check-solid.svg';
import rewardsIcon from '../icons/solid/circle-dollar-to-slot-solid.svg';
import notificationsIcon from '../icons/solid/bell-exclamation-solid.svg';
import setLocationIcon from '../icons/solid/solid-circle-location-arrow-user.svg';
import visitWebsiteIcon from '../icons/solid/globe-pointer-solid.svg';
import phoneIcon from '../icons/solid/phone-flip-solid.svg';
import getDirectionsIcon from '../icons/solid/diamond-turn-right-solid.svg';
import shareIcon from '../icons/solid/arrow-up-from-bracket-solid.svg';
import backButtonIcon from '../icons/solid/arrow-left-solid.svg';
import servingSizeIcon from '../icons/solid/user-group-simple-solid.svg';
import prepTimeIcon from '../icons/solid/clock-solid.svg';
import cookTimeIcon from '../icons/solid/temperature-three-quarters-solid.svg';
import totalTimeIcon from '../icons/solid/plate-utensils-solid.svg';
import loadingIcon from '../icons/solid/circle-notch-solid.svg';
import chevronRightIcon from '../icons/solid/chevron-right-solid.svg'
import moneyBillIcon from '../icons/solid/money-bill-solid.svg';
import facebookIcon from '../icons/brands/facebook-f-brands-solid.svg';
import instagramIcon from '../icons/brands/instagram-brands-solid.svg';
import twitterIcon from '../icons/brands/x-twitter-brands-solid.svg';
import tiktokIcon from '../icons/brands/tiktok-brands-solid.svg';
import youtubeIcon from '../icons/brands/youtube-brands-solid.svg';
import pinterestIcon from '../icons/brands/pinterest-brands-solid.svg';

//Regular icons
import homeRegularIcon from '../icons/regular/house-regular.svg';
import locationDotRegularIcon from '../icons/regular/location-dot-regular.svg';
import scissorsRegularIcon from '../icons/regular/scissors-regular.svg';
import plateUtensilsRegularIcon from '../icons/regular/plate-utensils-regular.svg';
import moreRegularIcon from '../icons/regular/circle-ellipsis-regular.svg';
import notificationsettingsRegularIcon from '../icons/regular/regular-bell-exclamation-gear.svg';
import mynotificationsRegularIcon from '../icons/regular/regular-bell-exclamation-circle-user.svg';
import mylocationRegularIcon from '../icons/regular/regular-circle-location-arrow-circle-user.svg';
import websiteRegularIcon from '../icons/regular/globe-pointer-regular.svg';
import adsRegularIcon from '../icons/regular/regular-calendar-range-circle-dollar.svg';
import rewardsRegularIcon from '../icons/regular/circle-dollar-to-slot-regular.svg';
import setlocationRegularIcon from '../icons/regular/cart-circle-check-regular.svg';
import salesRegularIcon from '../icons/regular/badge-dollar-regular.svg';
import getdirectionsRegularIcon from '../icons/regular/diamond-turn-right-regular.svg';
import callstoreRegularIcon from '../icons/regular/phone-flip-regular.svg';
import notificationsRegularIcon from '../icons/regular/bell-exclamation-regular.svg';
import nonotificationsRegularIcon from '../icons/regular/regular-bell-slash.svg';
import barcodecouponRegularIcon from '../icons/regular/regular-barcode-read-circle-dollar.svg';
import myaccountRegularIcon from '../icons/regular/square-user-regular.svg';
import recipeServingsRegularIcon from '../icons/regular/user-group-simple-regular.svg';
import recipePrepTimeRegularIcon from '../icons/regular/clock-regular.svg';
import recipeCookTimeRegularIcon from '../icons/regular/temperature-three-quarters-regular.svg';
import recipeTotalTimeRegularIcon from '../icons/regular/regular-plate-utensils-clock.svg';
import myBarcodeRegularIcon from '../icons/regular/regular-barcode-read-circle-user.svg';
import trashNotificationsRegularIcon from '../icons/regular/trash-can-clock-regular.svg';
import editGroceryListRegularIcon from '../icons/regular/regular-list-radio-pen.svg';
import sortGroceryListRegularIcon from '../icons/regular/bars-filter-regular.svg';
import trashCanRegularIcon from '../icons/regular/trash-can-regular.svg'
import cartShoppingRegularIcon from '../icons/regular/cart-shopping-regular.svg'

//Duotone icons
import handwaveDuotoneIcon from '../icons/duotone/hand-wave-duotone-regular.svg';

const customIcons = {
  'house': homeIcon,
  'location-dot': locationDotIcon,
  'fork-knife': recipesIcon,
  'more': moreIcon,
  'weekly-ad': weeklyAdIcon,
  'my-store': myStoreIcon,
  'rewards': rewardsIcon,
  'notifications': notificationsIcon,
  'set-location': setLocationIcon,
  'website': visitWebsiteIcon,
  'facebook': facebookIcon,
  'instagram': instagramIcon,
  'twitter': twitterIcon,
  'tiktok': tiktokIcon,
  'youtube': youtubeIcon,
  'pinterest': pinterestIcon,
  'phone': phoneIcon,
  'get-directions': getDirectionsIcon,
  'share': shareIcon,
  'back-button': backButtonIcon,
  'serving-size': servingSizeIcon,
  'prep-time': prepTimeIcon,
  'cook-time': cookTimeIcon,
  'total-time': totalTimeIcon,
  'app-loading': loadingIcon,
  'chevron-right': chevronRightIcon,
  'money-bill': moneyBillIcon,

  // Regular icons are below 
  'home-regular': homeRegularIcon,
  'locations-regular': locationDotRegularIcon,
  'coupons-regular': scissorsRegularIcon,
  'recipes-regular': plateUtensilsRegularIcon,
  'more-regular': moreRegularIcon,
  'ads-regular': adsRegularIcon,
  'rewards-regular': rewardsRegularIcon,
  'sales-regular': salesRegularIcon,
  'set-location-regular': setlocationRegularIcon,
  'notifications-regular': notificationsRegularIcon,
  'notifications-settings-regular': notificationsettingsRegularIcon,
  'my-notifications-regular': mynotificationsRegularIcon,
  'my-location-regular': mylocationRegularIcon,
  'website-regular': websiteRegularIcon,
  'get-directions-regular': getdirectionsRegularIcon,
  'call-store-regular': callstoreRegularIcon,
  'no-notifications-regular': nonotificationsRegularIcon,
  'barcode-coupon-regular': barcodecouponRegularIcon,
  'my-account-regular': myaccountRegularIcon,
  'recipe-servings-regular': recipeServingsRegularIcon,
  'recipe-prep-time-regular': recipePrepTimeRegularIcon,
  'recipe-cook-time-regular': recipeCookTimeRegularIcon,
  'recipe-total-time-regular': recipeTotalTimeRegularIcon,
  'my-barcode-regular': myBarcodeRegularIcon,
  'trash-notifications-regular': trashNotificationsRegularIcon,
  'edit-grocery-list-regular': editGroceryListRegularIcon,
  'sort-grocery-list-regular': sortGroceryListRegularIcon,
  'trash-can-regular': trashCanRegularIcon,
  'cart-shopping-regular': cartShoppingRegularIcon,
  // Duotone icons are below 
  'hand-wave-duotone': handwaveDuotoneIcon,
};

export function registerCustomIcons() {
  addIcons(customIcons);
}