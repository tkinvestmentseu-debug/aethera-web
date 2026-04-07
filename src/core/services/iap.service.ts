import { Platform } from 'react-native';

export const IAP_PRODUCTS = {
  MONTHLY:  Platform.OS === 'ios' ? 'aethera_premium_monthly'  : 'aethera_premium_monthly',
  YEARLY:   Platform.OS === 'ios' ? 'aethera_premium_yearly'   : 'aethera_premium_yearly',
  LIFETIME: Platform.OS === 'ios' ? 'aethera_premium_lifetime' : 'aethera_premium_lifetime',
} as const;

export const IAP_PRICES = {
  MONTHLY:  { display: '59,99 PLN', period: 'miesiac',     savings: '' },
  YEARLY:   { display: '499,00 PLN', period: 'rok',        savings: 'Oszczedzasz 31%' },
  LIFETIME: { display: '799,00 PLN', period: 'jednorazowo',savings: 'Raz na zawsze' },
};

class IAPServiceClass {
  private configured = false;

  async configure(): Promise<void> {
    try {
      // RevenueCat - odkomentuj po rejestracji na revenuecat.com
      // const Purchases = require('react-native-purchases').default;
      // await Purchases.configure({ apiKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '' });
      this.configured = true;
    } catch (e) { console.warn('[IAP] configure failed:', e); }
  }

  async purchaseMonthly(): Promise<boolean>  { return this.purchase(IAP_PRODUCTS.MONTHLY); }
  async purchaseYearly(): Promise<boolean>   { return this.purchase(IAP_PRODUCTS.YEARLY); }
  async purchaseLifetime(): Promise<boolean> { return this.purchase(IAP_PRODUCTS.LIFETIME); }

  private async purchase(productId: string): Promise<boolean> {
    try {
      // const Purchases = require('react-native-purchases').default;
      // const { customerInfo } = await Purchases.purchaseProduct(productId);
      // return !!customerInfo.entitlements.active['premium'];
      console.log('[IAP] Purchase:', productId);
      return false;
    } catch (e: any) {
      if (!e?.userCancelled) console.warn('[IAP] Purchase failed:', e);
      return false;
    }
  }

  async restorePurchases(): Promise<boolean> {
    try {
      // const Purchases = require('react-native-purchases').default;
      // const info = await Purchases.restorePurchases();
      // return !!info.entitlements.active['premium'];
      return false;
    } catch (e) { return false; }
  }

  async checkPremiumStatus(): Promise<boolean> {
    try {
      // const Purchases = require('react-native-purchases').default;
      // const info = await Purchases.getCustomerInfo();
      // return !!info.entitlements.active['premium'];
      return false;
    } catch { return false; }
  }
}

export const IAPService = new IAPServiceClass();