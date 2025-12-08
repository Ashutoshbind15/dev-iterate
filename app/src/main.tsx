import { createRoot } from "react-dom/client";
import "./index.css";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { BrowserRouter } from "react-router";
import Routes from "./components/layout/routes.tsx";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

createRoot(document.getElementById("root")!).render(
  <>
    <BrowserRouter>
      <ConvexProvider client={convex}>
        <Routes />
      </ConvexProvider>
    </BrowserRouter>
  </>
);
