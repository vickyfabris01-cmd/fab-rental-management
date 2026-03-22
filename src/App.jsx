// =============================================================================
// App.jsx
//
// Compatibility shim. The application entry point is main.jsx which mounts
// <AppRouter> directly. This file exists only so any legacy import of "App"
// continues to work without breaking.
//
// If you need to wrap the whole app with a context provider (e.g. a theme
// provider or feature-flag context), do it here.
// =============================================================================
export { default } from "./router/AppRouter.jsx";
