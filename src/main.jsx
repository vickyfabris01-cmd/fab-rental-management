import React                from "react";
import ReactDOM             from "react-dom/client";
import AppRouter            from "./router/AppRouter.jsx";
import { ToastContainer }   from "./components/feedback/Toast.jsx";
import { RootErrorBoundary } from "./components/feedback/ErrorBoundary.jsx";

// =============================================================================
// main.jsx — application entry point
//
// Renders:
//   <StrictMode>
//     <RootErrorBoundary>    ← Catches any crash that escapes page boundaries.
//       <AppRouter />        ← BrowserRouter + all routes + AppLoader bootstrap
//       <ToastContainer />   ← Global toast overlay, portal-rendered
//     </RootErrorBoundary>
//   </StrictMode>
// =============================================================================

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <AppRouter />
      <ToastContainer />
    </RootErrorBoundary>
  </React.StrictMode>
);
