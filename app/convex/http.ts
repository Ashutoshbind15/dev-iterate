import { httpRouter } from "convex/server";
import { getFeed } from "./httpactions/feed";
import { auth } from "./auth";

const http = httpRouter();

http.route({
  path: "/feed",
  method: "POST",
  handler: getFeed,
});

auth.addHttpRoutes(http);

export default http;
