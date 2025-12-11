/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actionsdir_diagramGeneration from "../actionsdir/diagramGeneration.js";
import type * as actionsdir_lessonContent from "../actionsdir/lessonContent.js";
import type * as actionsdir_personalizedQuestions from "../actionsdir/personalizedQuestions.js";
import type * as actionsdir_rss from "../actionsdir/rss.js";
import type * as actionsdir_weakness from "../actionsdir/weakness.js";
import type * as auth from "../auth.js";
import type * as http from "../http.js";
import type * as httpactions_feed from "../httpactions/feed.js";
import type * as httpactions_lessonContent from "../httpactions/lessonContent.js";
import type * as httpactions_personalizedQuestions from "../httpactions/personalizedQuestions.js";
import type * as httpactions_userWeakness from "../httpactions/userWeakness.js";
import type * as mutations_contents from "../mutations/contents.js";
import type * as mutations_diagrams from "../mutations/diagrams.js";
import type * as mutations_lessons from "../mutations/lessons.js";
import type * as mutations_personalizedQuestions from "../mutations/personalizedQuestions.js";
import type * as mutations_questions from "../mutations/questions.js";
import type * as mutations_rssSummaries from "../mutations/rssSummaries.js";
import type * as mutations_userWeakness from "../mutations/userWeakness.js";
import type * as queries_contents from "../queries/contents.js";
import type * as queries_diagrams from "../queries/diagrams.js";
import type * as queries_lessons from "../queries/lessons.js";
import type * as queries_personalizedQuestions from "../queries/personalizedQuestions.js";
import type * as queries_questions from "../queries/questions.js";
import type * as queries_user from "../queries/user.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actionsdir/diagramGeneration": typeof actionsdir_diagramGeneration;
  "actionsdir/lessonContent": typeof actionsdir_lessonContent;
  "actionsdir/personalizedQuestions": typeof actionsdir_personalizedQuestions;
  "actionsdir/rss": typeof actionsdir_rss;
  "actionsdir/weakness": typeof actionsdir_weakness;
  auth: typeof auth;
  http: typeof http;
  "httpactions/feed": typeof httpactions_feed;
  "httpactions/lessonContent": typeof httpactions_lessonContent;
  "httpactions/personalizedQuestions": typeof httpactions_personalizedQuestions;
  "httpactions/userWeakness": typeof httpactions_userWeakness;
  "mutations/contents": typeof mutations_contents;
  "mutations/diagrams": typeof mutations_diagrams;
  "mutations/lessons": typeof mutations_lessons;
  "mutations/personalizedQuestions": typeof mutations_personalizedQuestions;
  "mutations/questions": typeof mutations_questions;
  "mutations/rssSummaries": typeof mutations_rssSummaries;
  "mutations/userWeakness": typeof mutations_userWeakness;
  "queries/contents": typeof queries_contents;
  "queries/diagrams": typeof queries_diagrams;
  "queries/lessons": typeof queries_lessons;
  "queries/personalizedQuestions": typeof queries_personalizedQuestions;
  "queries/questions": typeof queries_questions;
  "queries/user": typeof queries_user;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
