import { httpRouter } from "convex/server";
import { getFeed } from "./httpactions/feed";
import { saveUserWeakness } from "./httpactions/userWeakness";
import { savePersonalizedQuestions } from "./httpactions/personalizedQuestions";
import { saveLessonContent } from "./httpactions/lessonContent";
import { saveTopics } from "./httpactions/topics";
import { saveTopicResearchSummary } from "./httpactions/topicResearchSummary";
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

auth.addHttpRoutes(http);

export default http;
