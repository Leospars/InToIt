import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/auth-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./utils/query-client";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>


        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>

    </AuthProvider>
  </React.StrictMode>
);