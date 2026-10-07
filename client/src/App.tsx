import { useEffect } from "react";
import { Redirect, Route, Switch, useLocation } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { CatalogProvider } from "./lib/catalog/store";
import { FavoritesProvider } from "./store/Favorites";
import RevealObserver from "./components/motion/RevealObserver";

import Home from "./pages/Home";
import Properties from "./pages/Properties";
import PropertyDetail from "./pages/PropertyDetail";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

import PropertiesList from "./pages/admin/PropertiesList";
import PropertyEdit from "./pages/admin/PropertyEdit";
import HomeOrder from "./pages/admin/HomeOrder";
import Options from "./pages/admin/Options";

/** يعيد الصفحة إلى الأعلى عند الانتقال بين المسارات (وليس عند تغيير الفلاتر) */
function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    // instant وليس auto: auto يتبع scroll-behavior: smooth في CSS فتنزلق الصفحة ببطء، وتقف
    // الرئيسية في منتصف قصة الهيرو أو آخرها بدل أولها
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location]);
  return null;
}

function Routes() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/properties" component={Properties} />
      <Route path="/property/:id" component={PropertyDetail} />
      <Route path="/contact" component={Contact} />

      <Route path="/admin">
        <Redirect to="/admin/properties" replace />
      </Route>
      <Route path="/admin/properties" component={PropertiesList} />
      <Route path="/admin/properties/:id" component={PropertyEdit} />
      <Route path="/admin/home" component={HomeOrder} />
      <Route path="/admin/options" component={Options} />

      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <CatalogProvider>
            <FavoritesProvider>
            <Toaster position="top-center" />
            <ScrollToTop />
            <Routes />
            <RevealObserver />
            </FavoritesProvider>
          </CatalogProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
