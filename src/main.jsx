import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { OrgProvider } from "./context/OrgContext.jsx";
import "./styles/index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <OrgProvider>
            <App />
          </OrgProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>
);
