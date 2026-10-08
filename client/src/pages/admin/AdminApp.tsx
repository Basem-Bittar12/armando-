/**
 * لوحة التحكم كاملة — تُحمَّل كقطعة منفصلة (lazy) فلا يحمّل زائر الموقع أي كود أو تنسيق منها.
 * كل مسار /admin/* محمي: بدون دخول تظهر صفحة الدخول، وحساب غير مسؤول يُرفض.
 */
import { Redirect, Route, Switch } from "wouter";
import "@/styles/dashboard.css";
import { AuthProvider, useAuth } from "@/lib/auth";
import Login from "./Login";
import PropertiesList from "./PropertiesList";
import PropertyEdit from "./PropertyEdit";
import HomeOrder from "./HomeOrder";
import Options from "./Options";
import Inquiries from "./Inquiries";
import ContactSettings from "./ContactSettings";
import More from "./More";
import Help from "./Help";

function Guarded() {
  const auth = useAuth();
  if (auth.status === "loading") {
    return (
      <div className="adm-login" aria-busy="true">
        <div className="adm-login__card adm-loading">
          <span className="skeleton-line" />
          <span className="skeleton-line skeleton-line--mid" />
        </div>
      </div>
    );
  }
  if (auth.status === "signed-out" || auth.status === "not-admin") return <Login />;
  return (
    <Switch>
      <Route path="/admin">
        <Redirect to="/admin/properties" replace />
      </Route>
      <Route path="/admin/login">
        <Redirect to="/admin/properties" replace />
      </Route>
      <Route path="/admin/properties" component={PropertiesList} />
      <Route path="/admin/properties/:id" component={PropertyEdit} />
      <Route path="/admin/home" component={HomeOrder} />
      <Route path="/admin/inquiries" component={Inquiries} />
      <Route path="/admin/options" component={Options} />
      <Route path="/admin/contact" component={ContactSettings} />
      <Route path="/admin/more" component={More} />
      <Route path="/admin/help" component={Help} />
      <Route>
        <Redirect to="/admin/properties" replace />
      </Route>
    </Switch>
  );
}

export default function AdminApp() {
  return (
    <AuthProvider>
      <Guarded />
    </AuthProvider>
  );
}
