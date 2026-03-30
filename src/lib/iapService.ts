import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  getAvailablePurchases,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  type Purchase,
} from 'expo-iap';
import { usePurchaseStore } from '../store/purchaseStore';

export const PRODUCT_ID = 'com.spicechef.app.pro_lifetime';

let purchaseUpdateSub: { remove: () => void } | null = null;
let purchaseErrorSub: { remove: () => void } | null = null;

export async function setupIAP(): Promise<void> {
  if (__DEV__) return; // IAP not available in Expo Go
  try {
    await initConnection();

    purchaseUpdateSub = purchaseUpdatedListener((purchase: Purchase) => {
      if (purchase.productId === PRODUCT_ID) {
        finishTransaction({ purchase, isConsumable: false });
        const date = typeof purchase.transactionDate === 'number'
          ? new Date(purchase.transactionDate).toISOString()
          : new Date().toISOString();
        usePurchaseStore.getState().setPro(date);
      }
    });

    purchaseErrorSub = purchaseErrorListener((error) => {
      console.warn('IAP error:', error.message);
    });
  } catch (err) {
    console.warn('IAP init failed:', err);
  }
}

export async function teardownIAP(): Promise<void> {
  purchaseUpdateSub?.remove();
  purchaseErrorSub?.remove();
  purchaseUpdateSub = null;
  purchaseErrorSub = null;
  await endConnection();
}

export async function getProProduct() {
  try {
    const products = await fetchProducts({ skus: [PRODUCT_ID], type: 'in-app' });
    if (!products) return null;
    return products.find((p) => p.id === PRODUCT_ID) ?? null;
  } catch {
    return null;
  }
}

export async function buyPro(): Promise<void> {
  await requestPurchase({
    request: {},
    type: 'in-app',
  });
}

export async function restoreProPurchase(): Promise<boolean> {
  try {
    const purchases = await getAvailablePurchases();
    const pro = purchases.find((p) => p.productId === PRODUCT_ID);
    if (pro) {
      const date = typeof pro.transactionDate === 'number'
        ? new Date(pro.transactionDate).toISOString()
        : new Date().toISOString();
      usePurchaseStore.getState().setPro(date);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
