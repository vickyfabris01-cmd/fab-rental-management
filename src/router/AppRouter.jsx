// src/router/AppRouter.jsx — MODIFIED FILE (replaces the old route tree)
//
// AIM
// The app's route tree. At this stage only the rebuilt screens are linked:
//   /                  temporary home page
//   /preview/*         developer testing pages (shell, components, forms, feedback...)
//   anything else      the 404 page
// The old pages (login, dashboards...) are NOT imported here, so nothing old can stop the site
// from loading, and no Supabase .env values are needed. Each rebuilt page is added to this
// file as it is finished.
//
// Developers who still need an old page can create .env.local with
//   VITE_ENABLE_LEGACY_PAGES=true
// and restart `npm run dev`. The old route tree (LegacyApp.jsx) is then loaded instead. This
// only works in development; a production build never contains the old pages.

import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { PageErrorBoundary } from "../components/feedback/ErrorBoundary.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import { ROUTE_META } from "./routes";

const LEGACY = import.meta.env.DEV && import.meta.env.VITE_ENABLE_LEGACY_PAGES === "true";

// The path is built at run time on purpose, so the build tools never follow it into the old code.
const LEGACY_PATH = "/src/router/" + "LegacyApp.jsx";
const LegacyApp = LEGACY ? lazy(() => import(/* @vite-ignore */ LEGACY_PATH)) : null;

const HomePlaceholder = lazy(() => import("../pages/public/HomePlaceholder.jsx"));
const NotFoundPage = lazy(() => import("../pages/public/NotFoundPage.jsx"));
const PreviewLayout = lazy(() => import("../pages/preview/PreviewPage.jsx"));
const PreviewSection = lazy(() =>
  import("../pages/preview/PreviewPage.jsx").then((m) => ({ default: m.PreviewSection })),
);

function PageLoader() {
  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "100dvh" }}>
      <Spinner size="lg" label="Loading" />
    </div>
  );
}

/** Keeps the browser tab title in step with the page. */
function TitleSync() {
  const { pathname } = useLocation();
  useEffect(() => {
    const title = ROUTE_META[pathname]?.title;
    document.title = title ? `${title} | BizKenia` : "BizKenia";
  }, [pathname]);
  return null;
}

export default function AppRouter() {
  if (LEGACY) {
    return (
      <Suspense fallback={<PageLoader />}>
        <LegacyApp />
      </Suspense>
    );
  }

  return (
    <BrowserRouter>
      <TitleSync />
      <PageErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePlaceholder />} />

            <Route path="/preview" element={<PreviewLayout />}>
              <Route index element={<Navigate to="components" replace />} />
              <Route path=":section" element={<PreviewSection />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </PageErrorBoundary>
    </BrowserRouter>
  );
}