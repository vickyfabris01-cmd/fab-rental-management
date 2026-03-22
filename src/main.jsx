import React                from "react";
import ReactDOM             from "react-dom/client";
import AppRouter            from "./router/AppRouter.jsx";

// The ToastContainer is the single global notification renderer.
// It subscribes to notificationStore.toasts and must be outside all layouts.
import { ToastContainer }   from "./components/feedback/Toast.jsx";

// =============================================================================
// main.jsx — application entry point
//
// Renders:
//   <StrictMode>
//     <AppRouter />        ← BrowserRouter + all routes + AppLoader bootstrap
//     <ToastContainer />   ← Global toast overlay, portal-rendered
//   </StrictMode>
//
// Nothing else should be imported here. All bootstrapping (auth init, tenant
// hydration, notification subscriptions) happens inside AppRouter's AppLoader.
// =============================================================================

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppRouter />
    <ToastContainer />
  </React.StrictMode>
);
