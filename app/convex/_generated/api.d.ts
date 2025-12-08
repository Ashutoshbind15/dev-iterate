/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as http from "../http.js";
import type * as httpactions_feed from "../httpactions/feed.js";
import type * as mutations_contents from "../mutations/contents.js";
import type * as mutations_diagrams from "../mutations/diagrams.js";
import type * as mutations_lessons from "../mutations/lessons.js";
import type * as mutations_rssSummaries from "../mutations/rssSummaries.js";
import type * as queries_contents from "../queries/contents.js";
import type * as queries_diagrams from "../queries/diagrams.js";
import type * as queries_lessons from "../queries/lessons.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  http: typeof http;
  "httpactions/feed": typeof httpactions_feed;
  "mutations/contents": typeof mutations_contents;
  "mutations/diagrams": typeof mutations_diagrams;
  "mutations/lessons": typeof mutations_lessons;
  "mutations/rssSummaries": typeof mutations_rssSummaries;
  "queries/contents": typeof queries_contents;
  "queries/diagrams": typeof queries_diagrams;
  "queries/lessons": typeof queries_lessons;
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
