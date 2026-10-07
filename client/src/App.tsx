import { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { DemoStoreProvider } from "./store/DemoStore";
import RevealObserver from "./components/motion/RevealObserver";

import Home from "./pages/Home";
import Properties from "./pages/Properties";
import PropertyDetail from "./pages/PropertyDetail";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

import Overview from "./pages/admin/Overview";
import PropertiesAdmin from "./pages/admin/PropertiesAdmin";
import Inquiries from "./pages/admin/Inquiries";
import Media from "./pages/admin/Media";
import Settings from "./pages/admin/Settings";
import UsersPage from "./pages/admin/UsersPage";

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

      <Route path="/admin" component={Overview} />
      <Route path="/admin/properties" component={PropertiesAdmin} />
      <Route path="/admin/inquiries" component={Inquiries} />
      <Route path="/admin/media" component={Media} />
      <Route path="/admin/settings" component={Settings} />
      <Route path="/admin/users" component={UsersPage} />

      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <DemoStoreProvider>
            <Toaster position="top-center" />
            <ScrollToTop />
            <Routes />
            <RevealObserver />
          </DemoStoreProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
