import App from "@/App";
import { Route } from "react-router";
import { Routes } from "react-router";
import Layout from ".";
import About from "@/pages/about";

const RouteComp = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<App />} />
        <Route path="/about" element={<About />} />
      </Route>
    </Routes>
  );
};
export default RouteComp;
