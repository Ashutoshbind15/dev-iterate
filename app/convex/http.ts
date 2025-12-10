import { httpRouter } from "convex/server";
import { getFeed } from "./httpactions/feed";
import { saveUserWeakness } from "./httpactions/userWeakness";
import { savePersonalizedQuestions } from "./httpactions/personalizedQuestions";
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

auth.addHttpRoutes(http);

export default http;
