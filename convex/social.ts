import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { requireIdentity, requireProfile } from "./lib/auth";

const profileDoc = v.object({
  _id: v.id("profiles"),
  _creationTime: v.number(),
  tokenIdentifier: v.string(),
  username: v.string(),
  normalizedUsername: v.string(),
  displayName: v.string(),
  avatarUrl: v.optional(v.string()),
  bio: v.optional(v.string()),
  accountStatus: v.union(v.literal("active"), v.literal("suspended")),
  followerCount: v.number(),
  followingCount: v.number(),
  postCount: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const profileSummary = v.object({
  _id: v.id("profiles"),
  username: v.string(),
  displayName: v.string(),
  avatarUrl: v.union(v.string(), v.null()),
  followerCount: v.number(),
  followingCount: v.number(),
  isFollowing: v.boolean(),
});

const feedPost = v.object({
  _id: v.id("posts"),
  _creationTime: v.number(),
  author: v.object({
    _id: v.id("profiles"),
    username: v.string(),
    displayName: v.string(),
    avatarUrl: v.union(v.string(), v.null()),
  }),
  mediaUrl: v.string(),
  mediaType: v.union(v.literal("image"), v.literal("video")),
  caption: v.union(v.string(), v.null()),
  createdAt: v.number(),
  likeCount: v.number(),
  commentCount: v.number(),
  isLiked: v.boolean(),
});

async function hydratePosts(
  ctx: QueryCtx,
  viewer: Doc<"profiles">,
  posts: Doc<"posts">[],
) {
  const viewerLikes = await ctx.db
    .query("likes")
    .withIndex("by_profile", (q) => q.eq("profileId", viewer._id))
    .take(500);
  const likedPostIds = new Set(viewerLikes.map((like) => like.postId));

  const hydrated = await Promise.all(
    posts.map(async (post) => {
      const [author, media] = await Promise.all([
        ctx.db.get(post.authorId),
        ctx.db.get(post.mediaId),
      ]);
      if (
        !author ||
        author.accountStatus !== "active" ||
        !media ||
        !media.storageId ||
        media.uploadState === "pending"
      ) {
        return null;
      }
      const mediaUrl = await ctx.storage.getUrl(media.storageId);
      if (!mediaUrl) return null;
      return {
        _id: post._id,
        _creationTime: post._creationTime,
        author: {
          _id: author._id,
          username: author.username,
          displayName: author.displayName,
          avatarUrl: author.avatarUrl ?? null,
        },
        mediaUrl,
        mediaType: media.mediaType,
        caption: post.caption ?? null,
        createdAt: post.createdAt,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        isLiked: likedPostIds.has(post._id),
      };
    }),
  );
  return hydrated.filter((post): post is NonNullable<typeof post> => post !== null);
}
export const myProfile = query({
  args: {},
  returns: v.union(profileDoc, v.null()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    return profile?.accountStatus === "active" ? profile : null;
  },
});

export const ensureMyProfile = mutation({
  args: {
    username: v.string(),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  returns: profileDoc,
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (existing) {
      if (existing.accountStatus !== "active") throw new Error("This account is unavailable.");
      return existing;
    }

    const username = args.username.trim().replace(/^@/, "");
    const normalizedUsername = username.toLowerCase();
    const displayName = args.displayName.trim();
    if (
      username.length < 3 ||
      username.length > 30 ||
      !/^[a-zA-Z0-9._]+$/.test(username) ||
      displayName.length < 1 ||
      displayName.length > 50
    ) {
      throw new Error("Choose a valid username and display name.");
    }

    const usernameTaken = await ctx.db
      .query("profiles")
      .withIndex("by_normalized_username", (q) => q.eq("normalizedUsername", normalizedUsername))
      .unique();
    if (usernameTaken) throw new Error("That username is already in use.");

    const now = Date.now();
    const profileId = await ctx.db.insert("profiles", {
      tokenIdentifier: identity.tokenIdentifier,
      username,
      normalizedUsername,
      displayName,
      ...(args.avatarUrl ? { avatarUrl: args.avatarUrl } : {}),
      accountStatus: "active",
      followerCount: 0,
      followingCount: 0,
      postCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    const profile = await ctx.db.get(profileId);
    if (!profile) throw new Error("Could not create your profile.");
    return profile;
  },
});

export const updateMyProfile = mutation({
  args: {
    username: v.string(),
    displayName: v.string(),
    bio: v.string(),
  },
  returns: profileDoc,
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    const username = args.username.trim().replace(/^@/, "");
    const normalizedUsername = username.toLowerCase();
    const displayName = args.displayName.trim();
    const bio = args.bio.trim();

    if (
      username.length < 3 ||
      username.length > 30 ||
      !/^[a-zA-Z0-9._]+$/.test(username)
    ) {
      throw new Error("Username must be 3â€“30 characters using letters, numbers, periods, or underscores.");
    }
    if (!displayName || displayName.length > 50) {
      throw new Error("Display name must be between 1 and 50 characters.");
    }
    if (bio.length > 160) {
      throw new Error("Bio can be up to 160 characters.");
    }

    const usernameTaken = await ctx.db
      .query("profiles")
      .withIndex("by_normalized_username", (q) => q.eq("normalizedUsername", normalizedUsername))
      .unique();
    if (usernameTaken && usernameTaken._id !== profile._id) {
      throw new Error("That username is already in use.");
    }

    await ctx.db.patch(profile._id, {
      username,
      normalizedUsername,
      displayName,
      bio: bio || undefined,
      updatedAt: Date.now(),
    });
    const updatedProfile = await ctx.db.get(profile._id);
    if (!updatedProfile) throw new Error("Could not update your profile.");
    return updatedProfile;
  },
});
export const profileByTokenIdentifier = internalQuery({
  args: { tokenIdentifier: v.string() },
  returns: v.union(profileDoc, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
      .unique();
  },
});

export const searchProfiles = query({
  args: { search: v.string() },
  returns: v.array(profileSummary),
  handler: async (ctx, args) => {
    const viewer = await requireProfile(ctx);
    const search = args.search.trim().toLowerCase();
    const candidates = await ctx.db.query("profiles").withIndex("by_normalized_username").take(100);
    const matching = candidates
      .filter(
        (profile) =>
          profile.accountStatus === "active" &&
          profile._id !== viewer._id &&
          (!search ||
            profile.normalizedUsername.includes(search) ||
            profile.displayName.toLowerCase().includes(search)),
      )
      .slice(0, 20);

    return await Promise.all(
      matching.map(async (profile) => {
        const edge = await ctx.db
          .query("follows")
          .withIndex("by_follower_and_following", (q) =>
            q.eq("followerId", viewer._id).eq("followingId", profile._id),
          )
          .unique();
        return {
          _id: profile._id,
          username: profile.username,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl ?? null,
          followerCount: profile.followerCount,
          followingCount: profile.followingCount,
          isFollowing: edge !== null,
        };
      }),
    );
  },
});

export const toggleFollow = mutation({
  args: { profileId: v.id("profiles") },
  returns: v.object({ following: v.boolean(), followerCount: v.number() }),
  handler: async (ctx, args) => {
    const viewer = await requireProfile(ctx);
    if (viewer._id === args.profileId) throw new Error("You cannot follow yourself.");
    const target = await ctx.db.get(args.profileId);
    if (!target || target.accountStatus !== "active") throw new Error("This profile is unavailable.");

    const edge = await ctx.db
      .query("follows")
      .withIndex("by_follower_and_following", (q) =>
        q.eq("followerId", viewer._id).eq("followingId", target._id),
      )
      .unique();

    if (edge) {
      await ctx.db.delete(edge._id);
      await ctx.db.patch(viewer._id, { followingCount: Math.max(0, viewer.followingCount - 1) });
      const followerCount = Math.max(0, target.followerCount - 1);
      await ctx.db.patch(target._id, { followerCount });
      return { following: false, followerCount };
    }

    await ctx.db.insert("follows", {
      followerId: viewer._id,
      followingId: target._id,
      createdAt: Date.now(),
    });
    await ctx.db.patch(viewer._id, { followingCount: viewer.followingCount + 1 });
    const followerCount = target.followerCount + 1;
    await ctx.db.patch(target._id, { followerCount });
    return { following: true, followerCount };
  },
});

export const createPost = mutation({
  args: { mediaId: v.id("media"), caption: v.string() },
  returns: v.id("posts"),
  handler: async (ctx, args) => {
    const author = await requireProfile(ctx);
    const media = await ctx.db.get(args.mediaId);
    if (!media || media.ownerId !== author._id || !media.storageId || media.uploadState !== "ready") {
      throw new Error("Upload your media before publishing.");
    }
    const caption = args.caption.trim();
    if (caption.length > 2200) throw new Error("Captions can be up to 2,200 characters.");

    const postId = await ctx.db.insert("posts", {
      authorId: author._id,
      mediaId: media._id,
      ...(caption ? { caption } : {}),
      createdAt: Date.now(),
      status: "active",
      likeCount: 0,
      commentCount: 0,
    });
    await ctx.db.patch(media._id, { uploadState: "attached" });
    await ctx.db.patch(author._id, { postCount: author.postCount + 1 });
    return postId;
  },
});

export const toggleLike = mutation({
  args: { postId: v.id("posts") },
  returns: v.object({ liked: v.boolean(), likeCount: v.number() }),
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post || post.status !== "active") throw new Error("This post is no longer available.");

    const existing = await ctx.db
      .query("likes")
      .withIndex("by_post_and_profile", (q) =>
        q.eq("postId", post._id).eq("profileId", profile._id),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      const likeCount = Math.max(0, post.likeCount - 1);
      await ctx.db.patch(post._id, { likeCount });
      return { liked: false, likeCount };
    }

    await ctx.db.insert("likes", {
      postId: post._id,
      profileId: profile._id,
      createdAt: Date.now(),
    });
    const likeCount = post.likeCount + 1;
    await ctx.db.patch(post._id, { likeCount });
    return { liked: true, likeCount };
  },
});

export const homeFeed = query({
  args: {},
  returns: v.array(feedPost),
  handler: async (ctx) => {
    const viewer = await requireProfile(ctx);
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", viewer._id))
      .take(40);
    const authorIds = [viewer._id, ...follows.map((follow) => follow.followingId)];
    const groups = await Promise.all(
      authorIds.map((authorId) =>
        ctx.db
          .query("posts")
          .withIndex("by_author_and_created_at", (q) => q.eq("authorId", authorId))
          .order("desc")
          .take(12),
      ),
    );
    const posts = groups
      .flat()
      .filter((post) => post.status === "active")
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 40);
    return await hydratePosts(ctx, viewer, posts);
  },
});

export const exploreFeed = query({
  args: {},
  returns: v.array(feedPost),
  handler: async (ctx) => {
    const viewer = await requireProfile(ctx);
    const posts = await ctx.db.query("posts").withIndex("by_created_at").order("desc").take(40);
    return await hydratePosts(
      ctx,
      viewer,
      posts.filter((post) => post.status === "active"),
    );
  },
});

export const profileById = query({
  args: { profileId: v.id("profiles") },
  returns: v.union(
    v.object({
      profile: v.object({
        _id: v.id("profiles"),
        username: v.string(),
        displayName: v.string(),
        avatarUrl: v.union(v.string(), v.null()),
        bio: v.union(v.string(), v.null()),
        postCount: v.number(),
        followerCount: v.number(),
        followingCount: v.number(),
        isFollowing: v.boolean(),
        isOwnProfile: v.boolean(),
      }),
      posts: v.array(feedPost),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const viewer = await requireProfile(ctx);
    const profile = await ctx.db.get(args.profileId);
    if (!profile || profile.accountStatus !== "active") return null;

    const follow = await ctx.db
      .query("follows")
      .withIndex("by_follower_and_following", (q) =>
        q.eq("followerId", viewer._id).eq("followingId", profile._id),
      )
      .unique();
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author_and_created_at", (q) => q.eq("authorId", profile._id))
      .order("desc")
      .take(40);

    return {
      profile: {
        _id: profile._id,
        username: profile.username,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl ?? null,
        bio: profile.bio ?? null,
        postCount: profile.postCount,
        followerCount: profile.followerCount,
        followingCount: profile.followingCount,
        isFollowing: follow !== null,
        isOwnProfile: profile._id === viewer._id,
      },
      posts: await hydratePosts(
        ctx,
        viewer,
        posts.filter((post) => post.status === "active"),
      ),
    };
  },
});

export const postById = query({
  args: { postId: v.id("posts") },
  returns: v.union(feedPost, v.null()),
  handler: async (ctx, args) => {
    const viewer = await requireProfile(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post || post.status !== "active") return null;
    const [hydratedPost] = await hydratePosts(ctx, viewer, [post]);
    return hydratedPost ?? null;
  },
});

export const commentsForPost = query({
  args: { postId: v.id("posts") },
  returns: v.array(
    v.object({
      _id: v.id("comments"),
      authorName: v.string(),
      username: v.string(),
      avatarUrl: v.union(v.string(), v.null()),
      body: v.string(),
      createdAt: v.number(),
      isMine: v.boolean(),
      canDelete: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const viewer = await requireProfile(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post || post.status !== "active") return [];

    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post_and_created_at", (q) => q.eq("postId", post._id))
      .order("desc")
      .take(50);

    const results = await Promise.all(
      comments.map(async (comment) => {
        const author = await ctx.db.get(comment.authorId);
        if (!author || author.accountStatus !== "active") return null;
        const isMine = comment.authorId === viewer._id;
        return {
          _id: comment._id,
          authorName: author.displayName,
          username: author.username,
          avatarUrl: author.avatarUrl ?? null,
          body: comment.body,
          createdAt: comment.createdAt,
          isMine,
          canDelete: isMine || post.authorId === viewer._id,
        };
      }),
    );
    return results
      .filter((comment): comment is NonNullable<typeof comment> => comment !== null)
      .reverse();
  },
});

export const addComment = mutation({
  args: { postId: v.id("posts"), body: v.string() },
  returns: v.id("comments"),
  handler: async (ctx, args) => {
    const author = await requireProfile(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post || post.status !== "active") throw new Error("This post is no longer available.");

    const body = args.body.trim();
    if (!body || body.length > 500) throw new Error("Comments must be between 1 and 500 characters.");

    const commentId = await ctx.db.insert("comments", {
      postId: post._id,
      authorId: author._id,
      body,
      createdAt: Date.now(),
    });
    await ctx.db.patch(post._id, { commentCount: post.commentCount + 1 });
    return commentId;
  },
});

export const removeComment = mutation({
  args: { commentId: v.id("comments") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const viewer = await requireProfile(ctx);
    const comment = await ctx.db.get(args.commentId);
    if (!comment) return null;
    const post = await ctx.db.get(comment.postId);
    if (!post) return null;
    if (comment.authorId !== viewer._id && post.authorId !== viewer._id) {
      throw new Error("You cannot delete this comment.");
    }
    await ctx.db.delete(comment._id);
    await ctx.db.patch(post._id, { commentCount: Math.max(0, post.commentCount - 1) });
    return null;
  },
});
