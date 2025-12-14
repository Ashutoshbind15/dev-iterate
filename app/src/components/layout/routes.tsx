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
import PersonalizedQuestionViewPage from "@/pages/personalized-question-view";
import PersonalizedQuestionSetViewPage from "@/pages/personalized-question-set-view";
import CodingSolvePage from "@/pages/coding-solve";
import CodingQuestionsPage from "@/pages/coding-questions";
import CreateCodingQuestionPage from "@/pages/create-coding-question";
import PersonalizedCodingQuestionsViewPage from "@/pages/personalized-coding-questions-view";
import PersonalizedCodingQuestionSetViewPage from "@/pages/personalized-coding-question-set-view";
import PersonalizedCodingSolvePage from "@/pages/personalized-coding-solve";

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

        {/* Coding problems - public to browse */}
        <Route path="/coding" element={<CodingQuestionsPage />} />

        <Route element={<AuthedWrapper />}>
          {/* Creator routes */}
          <Route path="/create/content" element={<CreateContentPage />} />
          <Route path="/create/diagram" element={<CreateDiagramPage />} />
          <Route path="/create/lesson" element={<CreateLessonPage />} />
          <Route path="/create/lesson/:id" element={<CreateLessonPage />} />
          <Route path="/manage/lessons" element={<ManageLessonsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/contribute" element={<ContributeQuestionPage />} />
          {/* Coding questions routes */}
          <Route path="/coding/create" element={<CreateCodingQuestionPage />} />
          <Route
            path="/coding/:questionId/solve"
            element={<CodingSolvePage />}
          />
          <Route
            path="/personalized-questions"
            element={<PersonalizedQuestionsViewPage />}
          />
          <Route
            path="/personalized-questions/set/:id"
            element={<PersonalizedQuestionSetViewPage />}
          />
          {/* Backwards-compatible route */}
          <Route
            path="/personalized-questions/:id"
            element={<PersonalizedQuestionSetViewPage />}
          />
          <Route
            path="/personalized-questions/question/:id"
            element={<PersonalizedQuestionViewPage />}
          />
          {/* Personalized coding questions routes */}
          <Route
            path="/personalized-coding"
            element={<PersonalizedCodingQuestionsViewPage />}
          />
          <Route
            path="/personalized-coding/set/:id"
            element={<PersonalizedCodingQuestionSetViewPage />}
          />
          <Route
            path="/personalized-coding/:questionId/solve"
            element={<PersonalizedCodingSolvePage />}
          />
        </Route>
      </Route>
    </Routes>
  );
};
export default RouteComp;
