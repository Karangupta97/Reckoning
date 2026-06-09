/**
 * Mock community feed / public reports data.
 * Typed with the exact same interfaces as the live API — zero drift risk.
 */

import type { ReportFeedItem, CommentItem, StoryItem } from "@/components/community/types";
import {
  MOCK_FEED,
  MOCK_COMMENTS,
  MOCK_STORIES,
} from "@/components/community/mockData";

export { MOCK_FEED as mockFeed, MOCK_COMMENTS as mockComments, MOCK_STORIES as mockStories };

/** Used as the `mockFn` argument to withMockFallback. */
export function getMockFeed(): ReportFeedItem[] {
  return MOCK_FEED;
}

export function getMockComments(): Record<string, CommentItem[]> {
  return MOCK_COMMENTS;
}

export function getMockStories(): StoryItem[] {
  return MOCK_STORIES;
}
