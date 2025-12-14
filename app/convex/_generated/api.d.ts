/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actionsdir_codeExecution from "../actionsdir/codeExecution.js";
import type * as actionsdir_codingWeakness from "../actionsdir/codingWeakness.js";
import type * as actionsdir_contentSubmission from "../actionsdir/contentSubmission.js";
import type * as actionsdir_diagramGeneration from "../actionsdir/diagramGeneration.js";
import type * as actionsdir_lessonContent from "../actionsdir/lessonContent.js";
import type * as actionsdir_personalizedCodeExecution from "../actionsdir/personalizedCodeExecution.js";
import type * as actionsdir_personalizedCodingQuestions from "../actionsdir/personalizedCodingQuestions.js";
import type * as actionsdir_personalizedQuestions from "../actionsdir/personalizedQuestions.js";
import type * as actionsdir_rss from "../actionsdir/rss.js";
import type * as actionsdir_topics from "../actionsdir/topics.js";
import type * as actionsdir_weakness from "../actionsdir/weakness.js";
import type * as auth from "../auth.js";
import type * as http from "../http.js";
import type * as httpactions_codingSubmissions from "../httpactions/codingSubmissions.js";
import type * as httpactions_codingUserWeakness from "../httpactions/codingUserWeakness.js";
import type * as httpactions_feed from "../httpactions/feed.js";
import type * as httpactions_lessonContent from "../httpactions/lessonContent.js";
import type * as httpactions_personalizedCodingQuestions from "../httpactions/personalizedCodingQuestions.js";
import type * as httpactions_personalizedCodingSubmissions from "../httpactions/personalizedCodingSubmissions.js";
import type * as httpactions_personalizedQuestions from "../httpactions/personalizedQuestions.js";
import type * as httpactions_summaries from "../httpactions/summaries.js";
import type * as httpactions_sysLesson from "../httpactions/sysLesson.js";
import type * as httpactions_sysLessonContent from "../httpactions/sysLessonContent.js";
import type * as httpactions_sysLessonDiagram from "../httpactions/sysLessonDiagram.js";
import type * as httpactions_topicResearchSummary from "../httpactions/topicResearchSummary.js";
import type * as httpactions_topics from "../httpactions/topics.js";
import type * as httpactions_userWeakness from "../httpactions/userWeakness.js";
import type * as mutations_codingQuestions from "../mutations/codingQuestions.js";
import type * as mutations_codingSubmissions from "../mutations/codingSubmissions.js";
import type * as mutations_codingUserWeakness from "../mutations/codingUserWeakness.js";
import type * as mutations_contents from "../mutations/contents.js";
import type * as mutations_diagrams from "../mutations/diagrams.js";
import type * as mutations_lessons from "../mutations/lessons.js";
import type * as mutations_personalizedCodingQuestions from "../mutations/personalizedCodingQuestions.js";
import type * as mutations_personalizedCodingSubmissions from "../mutations/personalizedCodingSubmissions.js";
import type * as mutations_personalizedQuestions from "../mutations/personalizedQuestions.js";
import type * as mutations_questions from "../mutations/questions.js";
import type * as mutations_rssSummaries from "../mutations/rssSummaries.js";
import type * as mutations_seed from "../mutations/seed.js";
import type * as mutations_sysContents from "../mutations/sysContents.js";
import type * as mutations_sysDiagrams from "../mutations/sysDiagrams.js";
import type * as mutations_sysLessons from "../mutations/sysLessons.js";
import type * as mutations_topicSummaries from "../mutations/topicSummaries.js";
import type * as mutations_topics from "../mutations/topics.js";
import type * as mutations_userWeakness from "../mutations/userWeakness.js";
import type * as queries_codingQuestions from "../queries/codingQuestions.js";
import type * as queries_codingSubmissions from "../queries/codingSubmissions.js";
import type * as queries_contents from "../queries/contents.js";
import type * as queries_diagrams from "../queries/diagrams.js";
import type * as queries_lessons from "../queries/lessons.js";
import type * as queries_personalizedCodingQuestions from "../queries/personalizedCodingQuestions.js";
import type * as queries_personalizedQuestions from "../queries/personalizedQuestions.js";
import type * as queries_questions from "../queries/questions.js";
import type * as queries_summaries from "../queries/summaries.js";
import type * as queries_sysLessons from "../queries/sysLessons.js";
import type * as queries_user from "../queries/user.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actionsdir/codeExecution": typeof actionsdir_codeExecution;
  "actionsdir/codingWeakness": typeof actionsdir_codingWeakness;
  "actionsdir/contentSubmission": typeof actionsdir_contentSubmission;
  "actionsdir/diagramGeneration": typeof actionsdir_diagramGeneration;
  "actionsdir/lessonContent": typeof actionsdir_lessonContent;
  "actionsdir/personalizedCodeExecution": typeof actionsdir_personalizedCodeExecution;
  "actionsdir/personalizedCodingQuestions": typeof actionsdir_personalizedCodingQuestions;
  "actionsdir/personalizedQuestions": typeof actionsdir_personalizedQuestions;
  "actionsdir/rss": typeof actionsdir_rss;
  "actionsdir/topics": typeof actionsdir_topics;
  "actionsdir/weakness": typeof actionsdir_weakness;
  auth: typeof auth;
  http: typeof http;
  "httpactions/codingSubmissions": typeof httpactions_codingSubmissions;
  "httpactions/codingUserWeakness": typeof httpactions_codingUserWeakness;
  "httpactions/feed": typeof httpactions_feed;
  "httpactions/lessonContent": typeof httpactions_lessonContent;
  "httpactions/personalizedCodingQuestions": typeof httpactions_personalizedCodingQuestions;
  "httpactions/personalizedCodingSubmissions": typeof httpactions_personalizedCodingSubmissions;
  "httpactions/personalizedQuestions": typeof httpactions_personalizedQuestions;
  "httpactions/summaries": typeof httpactions_summaries;
  "httpactions/sysLesson": typeof httpactions_sysLesson;
  "httpactions/sysLessonContent": typeof httpactions_sysLessonContent;
  "httpactions/sysLessonDiagram": typeof httpactions_sysLessonDiagram;
  "httpactions/topicResearchSummary": typeof httpactions_topicResearchSummary;
  "httpactions/topics": typeof httpactions_topics;
  "httpactions/userWeakness": typeof httpactions_userWeakness;
  "mutations/codingQuestions": typeof mutations_codingQuestions;
  "mutations/codingSubmissions": typeof mutations_codingSubmissions;
  "mutations/codingUserWeakness": typeof mutations_codingUserWeakness;
  "mutations/contents": typeof mutations_contents;
  "mutations/diagrams": typeof mutations_diagrams;
  "mutations/lessons": typeof mutations_lessons;
  "mutations/personalizedCodingQuestions": typeof mutations_personalizedCodingQuestions;
  "mutations/personalizedCodingSubmissions": typeof mutations_personalizedCodingSubmissions;
  "mutations/personalizedQuestions": typeof mutations_personalizedQuestions;
  "mutations/questions": typeof mutations_questions;
  "mutations/rssSummaries": typeof mutations_rssSummaries;
  "mutations/seed": typeof mutations_seed;
  "mutations/sysContents": typeof mutations_sysContents;
  "mutations/sysDiagrams": typeof mutations_sysDiagrams;
  "mutations/sysLessons": typeof mutations_sysLessons;
  "mutations/topicSummaries": typeof mutations_topicSummaries;
  "mutations/topics": typeof mutations_topics;
  "mutations/userWeakness": typeof mutations_userWeakness;
  "queries/codingQuestions": typeof queries_codingQuestions;
  "queries/codingSubmissions": typeof queries_codingSubmissions;
  "queries/contents": typeof queries_contents;
  "queries/diagrams": typeof queries_diagrams;
  "queries/lessons": typeof queries_lessons;
  "queries/personalizedCodingQuestions": typeof queries_personalizedCodingQuestions;
  "queries/personalizedQuestions": typeof queries_personalizedQuestions;
  "queries/questions": typeof queries_questions;
  "queries/summaries": typeof queries_summaries;
  "queries/sysLessons": typeof queries_sysLessons;
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
