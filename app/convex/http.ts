import { httpRouter } from "convex/server";
import { getFeed } from "./httpactions/feed";
import { saveUserWeakness } from "./httpactions/userWeakness";
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

auth.addHttpRoutes(http);

export default http;
