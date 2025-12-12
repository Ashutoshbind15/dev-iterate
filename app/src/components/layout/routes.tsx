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
import LessonViewPage from "@/pages/lesson-view";
import AuthedWrapper from "./authed";
import ProfilePage from "@/pages/profile";
import CorpusPage from "@/pages/corpus";
import ContributeQuestionPage from "@/pages/contribute-question";
import QuestionViewPage from "@/pages/question-view";
import LeaderboardPage from "@/pages/leaderboard";
import PersonalizedQuestionsViewPage from "@/pages/personalized-questions-view";

const RouteComp = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<App />} />
        <Route path="/about" element={<About />} />
        {/* Quiz routes */}
        <Route path="/corpus" element={<CorpusPage />} />
        <Route path="/corpus/:id" element={<QuestionViewPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />

        {/* Lessons are public to read */}
        <Route path="/lessons" element={<LessonsPage />} />
        <Route path="/lessons/:id" element={<LessonViewPage />} />

        <Route element={<AuthedWrapper />}>
          {/* Creator routes */}
          <Route path="/create/content" element={<CreateContentPage />} />
          <Route path="/create/diagram" element={<CreateDiagramPage />} />
          <Route path="/create/lesson" element={<CreateLessonPage />} />
          <Route path="/create/lesson/:id" element={<CreateLessonPage />} />
          <Route path="/manage/lessons" element={<ManageLessonsPage />} />
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
