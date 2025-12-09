import App from "@/App";
import { Route } from "react-router";
import { Routes } from "react-router";
import Layout from ".";
import About from "@/pages/about";
import CreateContentPage from "@/pages/create-content";
import CreateDiagramPage from "@/pages/create-diagram";
import CreateLessonPage from "@/pages/create-lesson";
import ManageLessonsPage from "@/pages/manage-lessons";
import LessonsPage from "@/pages/lessons";
import AuthedWrapper from "./authed";
import ProfilePage from "@/pages/profile";

const RouteComp = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<App />} />
        <Route path="/about" element={<About />} />
        {/* Creator routes */}
        <Route path="/create/content" element={<CreateContentPage />} />
        <Route path="/create/diagram" element={<CreateDiagramPage />} />
        <Route path="/create/lesson" element={<CreateLessonPage />} />
        <Route path="/create/lesson/:id" element={<CreateLessonPage />} />
        <Route path="/manage/lessons" element={<ManageLessonsPage />} />
        {/* Viewer routes */}
        <Route path="/lessons" element={<LessonsPage />} />

        <Route element={<AuthedWrapper />}>
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>
    </Routes>
  );
};
export default RouteComp;
