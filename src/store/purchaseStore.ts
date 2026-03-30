import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PurchaseState {
  isPro: boolean;
  purchaseDate: string | null;
  setPro: (date: string) => void;
  reset: () => void;
}

export const usePurchaseStore = create<PurchaseState>()(persist((set) => ({
  isPro: false,
  purchaseDate: null,

  setPro: (date) => set({ isPro: true, purchaseDate: date }),

  reset: () => set({ isPro: false, purchaseDate: null }),
}), {
  name: 'spicechef-purchase',
  storage: createJSONStorage(() => AsyncStorage),
}));
