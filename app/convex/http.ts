import { httpRouter } from "convex/server";
import { getFeed } from "./httpactions/feed";
import { saveUserWeakness } from "./httpactions/userWeakness";
import { savePersonalizedQuestions } from "./httpactions/personalizedQuestions";
import { saveLessonContent } from "./httpactions/lessonContent";
import { createSysLesson } from "./httpactions/sysLesson";
import {
  createPendingSysLessonContent,
  saveSysLessonContent,
} from "./httpactions/sysLessonContent";
import {
  createPendingSysLessonDiagram,
  saveSysLessonDiagram,
} from "./httpactions/sysLessonDiagram";
import { saveTopics } from "./httpactions/topics";
import { saveTopicResearchSummary } from "./httpactions/topicResearchSummary";
import { getRecentSummaries } from "./httpactions/summaries";
import {
  getTestCasesForJudge,
  updateSubmissionResult,
  markSubmissionRunning,
} from "./httpactions/codingSubmissions";
import { saveCodingUserWeakness } from "./httpactions/codingUserWeakness";
import { savePersonalizedCodingQuestions } from "./httpactions/personalizedCodingQuestions";
import {
  getPersonalizedTestCasesForJudge,
  updatePersonalizedSubmissionResult,
  markPersonalizedSubmissionRunning,
} from "./httpactions/personalizedCodingSubmissions";
import { auth } from "./auth";

const http = httpRouter();

http.route({
  path: "/feed",
  method: "POST",
  handler: getFeed,
});

http.route({
  path: "/user-weakness",
  method: "POST",
  handler: saveUserWeakness,
});

http.route({
  path: "/personalized-questions",
  method: "POST",
  handler: savePersonalizedQuestions,
});

http.route({
  path: "/lesson-content",
  method: "POST",
  handler: saveLessonContent,
});

// System-created lessons (callbacks from Kestra flows)
http.route({
  path: "/sys-lesson",
  method: "POST",
  handler: createSysLesson,
});

http.route({
  path: "/sys-lesson-content/pending",
  method: "POST",
  handler: createPendingSysLessonContent,
});

http.route({
  path: "/sys-lesson-content",
  method: "POST",
  handler: saveSysLessonContent,
});

http.route({
  path: "/sys-lesson-diagram/pending",
  method: "POST",
  handler: createPendingSysLessonDiagram,
});

http.route({
  path: "/sys-lesson-diagram",
  method: "POST",
  handler: saveSysLessonDiagram,
});

http.route({
  path: "/topics",
  method: "POST",
  handler: saveTopics,
});

http.route({
  path: "/topic-research-summary",
  method: "POST",
  handler: saveTopicResearchSummary,
});

http.route({
  path: "/summaries",
  method: "GET",
  handler: getRecentSummaries,
});

// Coding submission judge integration routes
// TODO: Add M2M auth token validation later
http.route({
  path: "/coding/testcases",
  method: "POST",
  handler: getTestCasesForJudge,
});

http.route({
  path: "/coding/submission-result",
  method: "POST",
  handler: updateSubmissionResult,
});

http.route({
  path: "/coding/submission-running",
  method: "POST",
  handler: markSubmissionRunning,
});

// Coding personalization routes
http.route({
  path: "/coding-user-weakness",
  method: "POST",
  handler: saveCodingUserWeakness,
});

http.route({
  path: "/personalized-coding-questions",
  method: "POST",
  handler: savePersonalizedCodingQuestions,
});

// Personalized coding submission judge integration routes
http.route({
  path: "/coding/personalized-testcases",
  method: "POST",
  handler: getPersonalizedTestCasesForJudge,
});

http.route({
  path: "/coding/personalized-submission-result",
  method: "POST",
  handler: updatePersonalizedSubmissionResult,
});

http.route({
  path: "/coding/personalized-submission-running",
  method: "POST",
  handler: markPersonalizedSubmissionRunning,
});

auth.addHttpRoutes(http);

export default http;
