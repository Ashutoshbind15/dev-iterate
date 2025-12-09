import { createRoot } from "react-dom/client";
import "./index.css";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { BrowserRouter } from "react-router";
import Routes from "./components/layout/routes.tsx";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(document.getElementById("root")!).render(
  <>
    <BrowserRouter>
      <ConvexAuthProvider client={convex}>
        <Routes />
      </ConvexAuthProvider>
    </BrowserRouter>
  </>
);
