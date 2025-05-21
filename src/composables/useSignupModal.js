import { ref, computed, h } from 'vue';
import CouponsApi from '../axios/apiCoupons';
import { TokenStorage } from '../utils/tokenStorage';
import {
  IonModal,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonSpinner,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonTitle,
  IonSegment,
  IonSegmentButton
} from '@ionic/vue';
import { closeOutline, alertCircleOutline } from 'ionicons/icons';
import { defineComponent } from 'vue';
import { useRouter } from 'vue-router';

export function useSignupModal() {
  const showModal = ref(false);
  const currentStep = ref(1);
  const phoneNumber = ref('');
  const pinCode = ref('');
  const isLoading = ref(false);
  const errorMessage = ref('');
  const isAuthenticated = ref(CouponsApi.isAuthenticated());
  const router = useRouter();
  const loyaltyNumber = ref('');
  const cardNumber = ref('');
  const customerInfo = ref(null);

  const userProfile = ref({
    firstName: '',
    lastName: '',
    birthday: '',
    email: '',
    zipCode: ''
  });

  const fetchCustomerInfo = async () => {
    try {
      const info = await CouponsApi.getCustomerInfo();
      customerInfo.value = info;

      if (!info.Email) {
        await promptUserInfoUpdate();
      } else {
        userProfile.value = {
          firstName: info.FirstName || '',
          lastName: info.LastName || '',
          birthday: info.Birthday || '',
          email: info.Email || '',
          zipCode: info.Zip || ''
        };
      }
    } catch (error) {
      console.error('Failed to fetch customer info:', error);
      errorMessage.value = 'Failed to retrieve customer information.';
    }
  };

  const promptUserInfoUpdate = async () => {
    let updatedInfo = {
      firstName: '',
      lastName: '',
      email: '',
      birthday: '',
      country: '',
      state: '',
      city: '',
      zip: '',
      address1: '',
      address2: '',
      optOutPromotion: false,
      doNotSellMyData: false
    };

    updatedInfo = await showUserInfoForm(updatedInfo);

    await CouponsApi.updateUserProfile(updatedInfo, TokenStorage.getRefreshToken());
  };

  const stepTitle = computed(() => {
    switch (currentStep.value) {
      case 1:
        return 'Enter Your Phone Number';
      case 2:
        return 'Verify Your Number';
      case 3:
        return 'Review Information and Confirm';
      case 4:
        return 'Start Saving Today';
      default:
        return '';
    }
  });

  const stepDescription = computed(() => {
    switch (currentStep.value) {
      case 1:
        return "We'll send you a text message with your verification code.";
      case 2:
        return `Enter the 4-digit code sent to ${formatPhone(phoneNumber.value)}`;
      case 3:
        return "Review your information and confirm to start saving today.";
      case 4:
        return "You're all set to start saving! Your account has been created successfully.";
      default:
        return '';
    }
  });

  const formatPhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  };

  const validatePhoneNumber = (value) => {
    return value.match(/^\d{10}$/);
  };

  const validatePinCode = (value) => {
    return value.match(/^\d{4}$/);
  };

  const openSignupModal = async () => {
    showModal.value = true;
    currentStep.value = 1;
    phoneNumber.value = '';
    pinCode.value = '';
    errorMessage.value = '';
  };

  const closeSignupModal = () => {
    showModal.value = false;
    currentStep.value = 1;
    phoneNumber.value = '';
    pinCode.value = '';
    errorMessage.value = '';
  };

  const handlePhoneInput = (event) => {
    const value = event.target.value.replace(/\D/g, '');
    phoneNumber.value = value;
    errorMessage.value = '';
  };

  const handlePinInput = (event) => {
    const value = event.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      pinCode.value = value;
      errorMessage.value = '';
    }
  };

  const submitPhoneNumber = async () => {
    const cleanPhone = phoneNumber.value.replace(/\D/g, '');

    if (!validatePhoneNumber(cleanPhone)) {
      errorMessage.value = 'Please enter a valid phone number.';
      return;
    }

    isLoading.value = true;
    try {
      const { status } = await CouponsApi.startCouponSignup(cleanPhone);
      if (status === 200) {
        currentStep.value = 2;
        errorMessage.value = '';
      }
    } catch (err) {
      errorMessage.value = 'Failed to send code. Please try again.';
    } finally {
      isLoading.value = false;
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    return dateString.replace(/\//g, '-');
  };

  const submitVerification = async () => {
    if (!validatePinCode(pinCode.value)) {
      errorMessage.value = 'Please enter a valid 4-digit code.';
      return;
    }

    isLoading.value = true;
    try {
      const response = await CouponsApi.verifyCode({
        phoneNumber: `+1${phoneNumber.value}`,
        pinCode: pinCode.value,
        IsoCountryCode: "US",
        merchantId: import.meta.env.VITE_COUPONS_MERCHANT_ID
      });

      const tokens = {
        access: response.data.access_token,
        refresh: response.data.refresh_token
      };

      if (tokens.access && tokens.refresh) {
        TokenStorage.setTokens(tokens.access, tokens.refresh);

        const customerInfo = await CouponsApi.getCustomerInfo();

        userProfile.value = {
          firstName: customerInfo.FirstName || userProfile.value.firstName,
          lastName: customerInfo.LastName || userProfile.value.lastName,
          birthday: formatDateForInput(customerInfo.Birthday) || userProfile.value.birthday,
          email: customerInfo.Email || userProfile.value.email,
          zipCode: customerInfo.Zip || userProfile.value.zipCode
        };

        loyaltyNumber.value = phoneNumber.value;
        cardNumber.value = customerInfo.cardNumber;
        localStorage.setItem('loyaltyNumber', phoneNumber.value);
        localStorage.setItem('CardNumber', customerInfo.cardNumber);

        isAuthenticated.value = true;
        currentStep.value = 3;
        errorMessage.value = '';

        window.dispatchEvent(new CustomEvent('userSignedUp', {
          detail: {
            loyaltyNumber: phoneNumber.value,
            cardNumber: customerInfo.cardNumber
          }
        }));
      } else {
        throw new Error('Missing tokens in response.');
      }
    } catch (err) {
      errorMessage.value = 'Invalid code. Please try again.';
    } finally {
      isLoading.value = false;
    }
  };

  const submitUserProfile = async () => {
    isLoading.value = true;
    try {
      const refreshToken = TokenStorage.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token found');
      }

      const response = await CouponsApi.updateUserProfile(userProfile.value, refreshToken);
      console.log('Profile updated successfully:', response);
      currentStep.value = 4;
    } catch (error) {
      console.error('Failed to update profile:', error);
      errorMessage.value = 'Failed to update profile. Please try again.';
    } finally {
      isLoading.value = false;
    }
  };

  const clipCoupon = async (offerId) => {
    if (!TokenStorage.hasTokens()) {
      openSignupModal();
      return false;
    }

    try {
      const response = await CouponsApi.clipCoupon(offerId);
      return response.status === 200;
    } catch (error) {
      return false;
    }
  };

  const getLoyaltyNumber = () => {
    return loyaltyNumber.value || localStorage.getItem('loyaltyNumber') || '';
  };

  const getCardNumber = () => {
    return cardNumber.value || localStorage.getItem('CardNumber') || '';
  };

  const renderPreviewStep = () => {
    return h('div', { class: 'form-section fade-in' }, [
      h('h1', 'Account Information Preview'),
      h('p', `First Name: ${userProfile.value.firstName}`),
      h('p', `Last Name: ${userProfile.value.lastName}`),
      h('p', `Birthday: ${userProfile.value.birthday}`),
      h('p', `Email: ${userProfile.value.email}`),
      h('p', `Zip Code: ${userProfile.value.zipCode}`),
      h(IonButton, {
        expand: 'block',
        class: 'submit-button',
        onClick: submitUserProfile,
        disabled: isLoading.value
      }, () => isLoading.value ? h(IonSpinner, { name: 'crescent' }) : 'Confirm Information')
    ]);
  };

  const renderUserInfoStep = () => {
    return h('div', { class: 'form-section fade-in' }, [
      h('h1', 'User Information'),
      h(IonItem, { class: 'custom-input' }, [
        h(IonLabel, { position: 'stacked' }, 'First Name'),
        h(IonInput, {
          type: 'text',
          modelValue: userProfile.value.firstName,
          'onUpdate:modelValue': (value) => userProfile.value.firstName = value,
          placeholder: 'First Name',
          class: 'user-input',
          disabled: isLoading.value
        })
      ]),
      h(IonItem, { class: 'custom-input' }, [
        h(IonLabel, { position: 'stacked' }, 'Last Name'),
        h(IonInput, {
          type: 'text',
          modelValue: userProfile.value.lastName,
          'onUpdate:modelValue': (value) => userProfile.value.lastName = value,
          placeholder: 'Last Name',
          class: 'user-input',
          disabled: isLoading.value
        })
      ]),
      h(IonItem, { class: 'custom-input' }, [
        h(IonLabel, { position: 'stacked' }, 'Birthday'),
        h(IonInput, {
          type: 'date',
          modelValue: userProfile.value.birthday,
          'onUpdate:modelValue': (value) => userProfile.value.birthday = value,
          placeholder: 'Birthday',
          class: 'user-input'
        })
      ]),
      h(IonItem, { class: 'custom-input' }, [
        h(IonLabel, { position: 'stacked' }, 'Email'),
        h(IonInput, {
          type: 'email',
          modelValue: userProfile.value.email,
          'onUpdate:modelValue': (value) => userProfile.value.email = value,
          placeholder: 'Email',
          class: 'user-input'
        })
      ]),
      h(IonItem, { class: 'custom-input' }, [
        h(IonLabel, { position: 'stacked' }, 'Zip Code'),
        h(IonInput, {
          type: 'number',
          modelValue: userProfile.value.zipCode,
          'onUpdate:modelValue': (value) => userProfile.value.zipCode = value,
          placeholder: 'Zip Code',
          maxlength: 5,
          class: 'user-input'
        })
      ]),
      h(IonButton, {
        expand: 'block',
        class: 'submit-button',
        onClick: submitUserProfile,
        disabled: isLoading.value
      }, () => isLoading.value ? h(IonSpinner, { name: 'crescent' }) : 'Submit')
    ]);
  };

  const renderStep4 = () => {
    return h('div', { class: 'form-section fade-in success-section' }, [
      h('div', { class: 'success-actions' }, [
        h(IonButton, {
          expand: 'block',
          class: 'action-button primary',
          onClick: () => {
            closeSignupModal();
            router.push('/tabs/coupons');
          }
        }, 'View Coupons'),

        h(IonButton, {
          expand: 'block',
          fill: 'outline',
          class: 'action-button secondary',
          onClick: () => {
            closeSignupModal();
            router.push('/tabs/preferences');
          }
        }, 'Manage Preferences')
      ])
    ]);
  };

  const SignupModal = defineComponent({
    setup() {
      return () => h(IonModal, {
        isOpen: showModal.value,
        onDidDismiss: closeSignupModal,
        class: 'auth-modal',
        breakpoints: [1],
        swipeToClose: false,
        backdropDismiss: false
      }, [
        h(IonHeader, [
          h(IonToolbar, [
            h(IonButtons, { slot: 'end' }, [
              h(IonButton, {
                onClick: () => {
                  showModal.value = false;
                  closeSignupModal();
                }
              }, 'Close')
            ]),
            h(IonTitle, 'Sign Up or Sign In')
          ])
        ]),
        h(IonContent, { 
          class: 'ion-padding modal-content-wrapper',
          keyboardClose: true,
          scrollY: true
        }, [
          h('div', { class: 'modal-content' }, [
            h('div', { class: 'progress-steps' }, [
              h('div', {
                class: `step ${currentStep.value === 1 ? 'active' : currentStep.value > 1 ? 'completed' : ''}`,
              }, '1'),
              h('div', { class: 'step-line' }),
              h('div', {
                class: `step ${currentStep.value === 2 ? 'active' : currentStep.value > 2 ? 'completed' : ''}`,
              }, '2'),
              h('div', { class: 'step-line' }),
              h('div', {
                class: `step ${currentStep.value === 3 ? 'active' : currentStep.value > 3 ? 'completed' : ''}`,
              }, '3'),
              h('div', { class: 'step-line' }),
              h('div', {
                class: `step ${currentStep.value === 4 ? 'active' : ''}`,
              }, '4')
            ]),

            h('div', { class: 'header-section' }, [
              h('div', { class: 'emoji-wrapper' },
                currentStep.value === 1 ? '👋' :
                  currentStep.value === 2 ? '📱' :
                    currentStep.value === 3 ? '✍️' :
                      '🎉'
              ),
              h('h1', stepTitle.value),
              h('p', { class: 'subtitle' }, stepDescription.value)
            ]),

            currentStep.value === 1 && h('div', { class: 'form-section fade-in' }, [
              h(IonItem, { class: 'custom-input' }, [
                h(IonLabel, { position: 'stacked' }, 'Phone Number'),
                h(IonInput, {
                  type: 'tel',
                  value: phoneNumber.value,
                  onIonInput: handlePhoneInput,
                  placeholder: '(555) 555-5555',
                  disabled: isLoading.value,
                  class: 'phone-input',
                  enterkeyhint: 'next',
                  inputmode: 'tel',
                  clearInput: true
                })
              ]),
              h(IonButton, {
                expand: 'block',
                class: 'submit-button',
                onClick: submitPhoneNumber,
                disabled: isLoading.value || !phoneNumber.value
              }, () => isLoading.value ? h(IonSpinner, { name: 'crescent' }) : 'Continue')
            ]),

            currentStep.value === 2 && h('div', { class: 'form-section fade-in' }, [
              h(IonItem, { class: 'custom-input' }, [
                h(IonLabel, { position: 'stacked' }, 'Verification Code'),
                h(IonInput, {
                  type: 'tel',
                  value: pinCode.value,
                  onIonInput: handlePinInput,
                  placeholder: 'Enter 4-digit code',
                  disabled: isLoading.value,
                  maxlength: 4,
                  class: 'verification-input',
                  enterkeyhint: 'done',
                  inputmode: 'numeric',
                  clearInput: true
                })
              ]),
              h(IonButton, {
                expand: 'block',
                class: 'submit-button',
                onClick: submitVerification,
                disabled: isLoading.value || !pinCode.value
              }, () => isLoading.value ? h(IonSpinner, { name: 'crescent' }) : 'Verify')
            ]),

            currentStep.value === 3 && renderUserInfoStep(),

            currentStep.value === 4 && renderStep4(),

            errorMessage.value && h('div', { class: 'error-container' }, [
              h(IonIcon, { icon: alertCircleOutline, color: 'danger' }),
              h('p', errorMessage.value)
            ])
          ])
        ])
      ])
    }
  });

  const style = document.createElement('style');
  style.textContent = `
    .auth-modal {
      --height: 100%;
      --background: var(--ion-color-light);
    }

    .modal-content-wrapper {
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
      width: 100%;
      height: 100%;
      overflow: auto;
      touch-action: auto;
      position: relative;
      will-change: transform;
      transform: translateZ(0);
    }

    .modal-content {
      display: flex;
      flex-direction: column;
      min-height: 100%;
      padding: 24px;
      max-width: 400px;
      margin: 0 auto;
      position: relative;
      // padding-bottom: 100px;
    }

    .progress-steps {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 32px;
      margin-top: 16px;
    }

    .step {
      width: 32px;
      height: 32px;
      border-radius: 100%;
      background: var(--ion-color-medium-tint);
      color: var(--ion-color-light);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      transition: all 0.3s ease;
      margin-top: 40px;
    }

    .step.active {
      background: var(--ion-color-success);
      color: var(--ion-color-light);
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(var(--ion-color-primary-rgb), 0.2);
      margin-top: 40px;
    }

    .step-line {
      height: 2px;
      width: 40px;
      background: var(--ion-color-medium-tint);
      margin: 0 8px;
      margin-top: 40px;
    }

    .close-button {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 999;
      --padding-start: 8px;
      --padding-end: 8px;
      --color: var(--ion-color-medium);
      --background: rgba(255, 255, 255, 0.9);
      --border-radius: 50%;
      --width: 40px;
      --height: 40px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .close-button:hover {
      --background: rgba(255, 255, 255, 1);
      --color: var(--ion-color-dark);
    }

    .header-section {
      text-align: center;
      margin-bottom: 20px;
    }

    .emoji-wrapper {
      font-size: 48px;
      margin-bottom: 8px;
      animation: bounce 0.6s ease;
    }

    .header-section h1 {
      font-size: 32px;
      font-weight: 700;
      color: var(--ion-color-dark);
      margin-bottom: 8px;
      line-height: 1.2;
    }

    .subtitle {
      font-size: 18px;
      font-weight: 600;
      color: var(--ion-color-medium);
      line-height: 1.6;
      margin-bottom: 8px;
    }

    .form-section {
      margin-bottom: 20px;
      padding-top: 0px;
      overflow-y: visible;
      flex: 1;
    }

    .custom-input {
      --background: transparent;
      --border-color: var(--ion-color-light-shade);
      --border-radius: 8px;
      --border-width: 2px;
      margin-bottom: 10px;
      --highlight-height: 2px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }

    .custom-input.ion-valid {
      --border-color: var(--ion-color-success);
    }

    .phone-input {
      font-size: 18px;
      --padding: 12px;
    }

    .submit-button {
      margin-top: 16px;
      margin-bottom: 5px;
      height: 52px;
      font-size: 16px;
      font-weight: 600;
      --border-radius: 8px;
      text-transform: none;
      --box-shadow: 0 4px 12px rgba(var(--ion-color-primary-rgb), 0.2);
    }

    .submit-button:hover {
      --background: var(--ion-color-primary-shade);
      transform: translateY(-1px);
      transition: all 0.2s ease;
    }

    .error-container {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--ion-color-danger-tint);
      padding: 16px;
      border-radius: 12px;
      margin-top: 16px;
      animation: shake 0.4s ease-in-out;
    }

    .step.completed {
      background: var(--ion-color-success);
      color: white;
    }

    .success-section {
      text-align: center;
    }

    .success-actions {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 32px;
    }

    .action-button {
      height: 52px;
      font-size: 16px;
      font-weight: 600;
      text-transform: none;
    }

    .action-button.primary {
      --background: var(--ion-color-primary);
      --border-radius: 12px;
      --box-shadow: 0 4px 12px rgba(var(--ion-color-primary-rgb), 0.2);
    }

    .action-button.secondary {
      --border-radius: 12px;
      --border-color: var(--ion-color-primary);
      --color: var(--ion-color-primary);
    }

    .preferences-note {
      margin-top: 24px;
      font-size: 14px;
      color: var(--ion-color-medium);
    }

    .preferences-note a {
      color: var(--ion-color-primary);
      text-decoration: none;
      font-weight: 500;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
  `;
  document.head.appendChild(style);

  return {
    showModal,
    isAuthenticated,
    openSignupModal,
    closeSignupModal,
    clipCoupon,
    SignupModal,
    getLoyaltyNumber,
    getCardNumber,
    cardNumber,
  };
} 
