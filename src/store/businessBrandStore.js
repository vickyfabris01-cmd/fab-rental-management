// src/store/businessBrandStore.js — NEW FILE
//
// AIM
// "Which business is this screen about?" for the logo. A business page, the room request page
// and every screen inside /app/:slug tell this store which business they show. BrandLogo with the
// `contextual` prop then draws that business's logo (or its first letter) in place of the
// BizKenia mark. Footers and sign-in pages do not use `contextual`, so they keep the platform logo.

import { create } from "zustand";

export const useBusinessBrandStore = create((set) => ({
  business: null, // { id, name, logo_url }
  set: (business) => set({ business }),
  clear: () => set({ business: null }),
}));

export default useBusinessBrandStore;