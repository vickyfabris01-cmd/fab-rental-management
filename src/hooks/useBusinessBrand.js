// src/hooks/useBusinessBrand.js — NEW FILE
//
// AIM
// Call it in a screen that belongs to one business: useBusinessBrand(business). While the screen
// is open, the header and sidebar logo become that business's logo. It resets when the screen
// closes. Pass null or undefined while the business is still loading.

import { useEffect } from "react";
import useBusinessBrandStore from "../store/businessBrandStore.js";

export default function useBusinessBrand(business) {
  const id = business?.id;
  const name = business?.name;
  const logo = business?.logo_url || null;
  useEffect(() => {
    if (!id) return undefined;
    useBusinessBrandStore.getState().set({ id, name, logo_url: logo });
    return () => useBusinessBrandStore.getState().clear();
  }, [id, name, logo]);
}