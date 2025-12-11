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
import CorpusPage from "@/pages/corpus";
import ContributeQuestionPage from "@/pages/contribute-question";
import QuestionViewPage from "@/pages/question-view";
import LeaderboardPage from "@/pages/leaderboard";
import PersonalizedQuestionsViewPage from "@/pages/personalized-questions-view";
import MermaidTestPage from "@/pages/mermaid-test";

const RouteComp = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<App />} />
        <Route path="/about" element={<About />} />
        {/* Creator routes */}
        <Route path="/create/content" element={<CreateContentPage />} />
        <Route path="/create/diagram" element={<CreateDiagramPage />} />
        <Route path="/test/mermaid" element={<MermaidTestPage />} />
        <Route path="/create/lesson" element={<CreateLessonPage />} />
        <Route path="/create/lesson/:id" element={<CreateLessonPage />} />
        <Route path="/manage/lessons" element={<ManageLessonsPage />} />
        {/* Viewer routes */}
        <Route path="/lessons" element={<LessonsPage />} />
        {/* Quiz routes */}
        <Route path="/corpus" element={<CorpusPage />} />
        <Route path="/corpus/:id" element={<QuestionViewPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />

        <Route element={<AuthedWrapper />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/contribute" element={<ContributeQuestionPage />} />
          <Route
            path="/personalized-questions"
            element={<PersonalizedQuestionsViewPage />}
          />
          <Route
            path="/personalized-questions/:id"
            element={<PersonalizedQuestionsViewPage />}
          />
        </Route>
      </Route>
    </Routes>
  );
};
export default RouteComp;
