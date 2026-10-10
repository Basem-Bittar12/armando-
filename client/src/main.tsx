import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/loading.css";
import { installImgFallback } from "./lib/imgFallback";

// المتصفح لا يعيد موضع السكرول تلقائياً بعد التحديث: الرئيسية تبدأ دائماً من أول قصة الهيرو
if ("scrollRestoration" in history) history.scrollRestoration = "manual";

installImgFallback();

createRoot(document.getElementById("root")!).render(<App />);
