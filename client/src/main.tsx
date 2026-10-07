import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// المتصفح لا يعيد موضع السكرول تلقائياً بعد التحديث: الرئيسية تبدأ دائماً من أول قصة الهيرو
if ("scrollRestoration" in history) history.scrollRestoration = "manual";

createRoot(document.getElementById("root")!).render(<App />);
