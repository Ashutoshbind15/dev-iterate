import { httpRouter } from "convex/server";
import { getFeed } from "./httpactions/feed";

const http = httpRouter();

http.route({
  path: "/feed",
  method: "POST",
  handler: getFeed,
});

export default http;
