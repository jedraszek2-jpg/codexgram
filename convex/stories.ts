import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireProfile } from "./lib/auth";

const MAX_STORY_BYTES = 10 * 1024 * 1024;

const activeStoryGroup = v.object({
  author: v.object({
    _id: v.id("profiles"),
    username: v.string(),
    displayName: v.string(),
    avatarUrl: v.union(v.string(), v.null()),
  }),
  stories: v.array(
    v.object({
      storyId: v.id("stories"),
      mediaUrl: v.string(),
      createdAt: v.number(),
      expiresAt: v.number(),
    }),
  ),
});

export const generateStoryUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireProfile(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const createStory = mutation({
  args: { mediaId: v.id("_storage") },
  returns: v.id("stories"),
  handler: async (ctx, args) => {
    const author = await requireProfile(ctx);
    const metadata = await ctx.db.system.get("_storage", args.mediaId);
    if (!metadata) throw new Error("The uploaded photo could not be found.");
    if (metadata.size > MAX_STORY_BYTES) throw new Error("Story photos must be 10 MB or smaller.");
    if (!metadata.contentType?.startsWith("image/")) {
      throw new Error("Stories can only contain image files.");
    }

    const mediaUrl = await ctx.storage.getUrl(args.mediaId);
    if (!mediaUrl) throw new Error("The uploaded photo could not be loaded.");

    const createdAt = Date.now();
    return await ctx.db.insert("stories", {
      authorId: author._id,
      mediaId: args.mediaId,
      createdAt,
      expiresAt: createdAt + 24 * 60 * 60 * 1000,
    });
  },
});

export const getActiveStories = query({
  args: { now: v.number() },
  returns: v.array(activeStoryGroup),
  handler: async (ctx, args) => {
    const viewer = await requireProfile(ctx);
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", viewer._id))
      .take(100);

    const groups = await Promise.all(
      follows.map(async (follow) => {
        const author = await ctx.db.get(follow.followingId);
        if (!author || author.accountStatus !== "active") return null;

        const activeStories = await ctx.db
          .query("stories")
          .withIndex("by_author_and_expires_at", (q) =>
            q.eq("authorId", author._id).gt("expiresAt", args.now),
          )
          .order("desc")
          .take(20);

        const storyItems = await Promise.all(
          activeStories.map(async (story) => {
            const mediaUrl = await ctx.storage.getUrl(story.mediaId);
            return mediaUrl
              ? {
                  storyId: story._id,
                  mediaUrl,
                  createdAt: story.createdAt,
                  expiresAt: story.expiresAt,
                }
              : null;
          }),
        );
        const stories = storyItems.filter((story): story is NonNullable<typeof story> => story !== null);
        if (stories.length === 0) return null;

        return {
          author: {
            _id: author._id,
            username: author.username,
            displayName: author.displayName,
            avatarUrl: author.avatarUrl ?? null,
          },
          stories,
        };
      }),
    );

    return groups
      .filter((group): group is NonNullable<typeof group> => group !== null)
      .sort((a, b) => b.stories[0].createdAt - a.stories[0].createdAt);
  },
});
