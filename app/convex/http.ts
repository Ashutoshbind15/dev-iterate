import { httpRouter } from "convex/server";
import { getFeed } from "./httpactions/feed";
import { saveUserWeakness } from "./httpactions/userWeakness";
import { savePersonalizedQuestions } from "./httpactions/personalizedQuestions";
import { saveLessonContent } from "./httpactions/lessonContent";
import { saveTopics } from "./httpactions/topics";
import { saveTopicResearchSummary } from "./httpactions/topicResearchSummary";
import {
  getTestCasesForJudge,
  updateSubmissionResult,
  markSubmissionRunning,
} from "./httpactions/codingSubmissions";
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

auth.addHttpRoutes(http);

export default http;
