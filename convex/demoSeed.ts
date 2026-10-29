import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";

const DEMO_PROFILES = [
  { username: "demo.anna", displayName: "Anna Kowalska", bio: "Finding small moments of beauty." },
  { username: "demo.tomasz", displayName: "Tomasz Nowak", bio: "Light, streets, and long walks." },
  { username: "demo.kasia", displayName: "Kasia Zielinska", bio: "A little travel diary." },
  { username: "demo.ola", displayName: "Ola Wisniewska", bio: "Color makes an ordinary day." },
  { username: "demo.pawel", displayName: "Pawel Lewandowski", bio: "Good food, better company." },
  { username: "demo.maja", displayName: "Maja Wojcik", bio: "Outside whenever I can be." },
  { username: "demo.leon", displayName: "Leon Kaminski", bio: "Coastal air and quiet places." },
  { username: "demo.lena", displayName: "Lena Dabrowska", bio: "Collecting frames and stories." },
  { username: "demo.kuba", displayName: "Kuba Mazur", bio: "Coffee first, then everything else." },
  { username: "demo.nina", displayName: "Nina Krawczyk", bio: "Growing things, slowly." },
] as const;

const DEMO_POSTS = [
  { key: "anna-old-town", author: "demo.anna", assetKey: "explore-tile-01", caption: "Morning light found its way to the old town.", hoursAgo: 1 },
  { key: "anna-color", author: "demo.anna", assetKey: "profile-grid-1", caption: "A little color for the feed today.", hoursAgo: 49 },
  { key: "tomasz-city", author: "demo.tomasz", assetKey: "explore-tile-02", caption: "Took the long way home again.", hoursAgo: 2 },
  { key: "tomasz-detail", author: "demo.tomasz", assetKey: "profile-grid-2", caption: "The details are the whole story.", hoursAgo: 52 },
  { key: "kasia-flowers", author: "demo.kasia", assetKey: "explore-tile-03", caption: "Slow Sunday, fresh flowers, no plans.", hoursAgo: 3 },
  { key: "kasia-palette", author: "demo.kasia", assetKey: "profile-grid-3", caption: "Saving this palette for later.", hoursAgo: 55 },
  { key: "ola-coffee", author: "demo.ola", assetKey: "explore-tile-04", caption: "A quiet table and a very good coffee.", hoursAgo: 4 },
  { key: "ola-sketch", author: "demo.ola", assetKey: "profile-grid-4", caption: "A few sketches from this week.", hoursAgo: 58 },
  { key: "pawel-sunset", author: "demo.pawel", assetKey: "explore-tile-05", caption: "Dinner tastes better outside.", hoursAgo: 5 },
  { key: "pawel-kitchen", author: "demo.pawel", assetKey: "profile-grid-5", caption: "Testing a new recipe tonight.", hoursAgo: 61 },
  { key: "maja-trail", author: "demo.maja", assetKey: "explore-tile-06", caption: "Found a trail worth coming back to.", hoursAgo: 6 },
  { key: "maja-weekend", author: "demo.maja", assetKey: "profile-grid-6", caption: "Weekend reset, one step at a time.", hoursAgo: 64 },
  { key: "leon-cat", author: "demo.leon", assetKey: "explore-tile-07", caption: "The new neighbor has excellent timing.", hoursAgo: 7 },
  { key: "leon-coast", author: "demo.leon", assetKey: "chat-coast-photo", caption: "Could listen to these waves all day.", hoursAgo: 67 },
  { key: "lena-flowers", author: "demo.lena", assetKey: "explore-tile-08", caption: "A basket full of color.", hoursAgo: 8 },
  { key: "lena-dog", author: "demo.lena", assetKey: "home-post-dog", caption: "Met the best hiking companion.", hoursAgo: 70 },
  { key: "kuba-village", author: "demo.kuba", assetKey: "explore-tile-09", caption: "Little streets by the sea.", hoursAgo: 9 },
  { key: "kuba-lavender", author: "demo.kuba", assetKey: "explore-tile-10", caption: "Lavender season never lasts long enough.", hoursAgo: 73 },
  { key: "nina-breakfast", author: "demo.nina", assetKey: "explore-tile-11", caption: "Breakfast with a view this morning.", hoursAgo: 10 },
  { key: "nina-cove", author: "demo.nina", assetKey: "explore-tile-12", caption: "Already planning the next swim.", hoursAgo: 76 },
] as const;

const COMMENT_BODIES = [
  "This light is unreal.",
  "Adding this to my weekend list.",
  "Such a good moment.",
  "The colors here are perfect.",
  "I would stay here all afternoon.",
  "Already planning a trip.",
  "This made my day.",
  "Please share more like this.",
] as const;

const uploadTaskValidator = v.object({
  seedKey: v.string(),
  assetKey: v.string(),
  mediaId: v.id("media"),
  uploadUrl: v.string(),
});

export const prepareDemoData = internalMutation({
  args: { payload: v.array(v.number()) },

  returns: v.object({
    profiles: v.number(),
    expectedPosts: v.number(),
    uploads: v.array(uploadTaskValidator),
  }),
  handler: async (ctx, args) => {
    const payload = JSON.parse(new TextDecoder().decode(new Uint8Array(args.payload))) as {
      assets: Array<{ assetKey: string; byteSize: number; contentType: string }>;
    };
    if (!Array.isArray(payload.assets) || args.payload.length > 8000) throw new Error("Invalid demo asset payload.");
    const assets = new Map(payload.assets.map((asset) => [asset.assetKey, asset]));
    if (assets.size !== payload.assets.length) throw new Error("The demo asset list contains duplicates.");
    for (const post of DEMO_POSTS) {
      const asset = assets.get(post.assetKey);
      if (!asset || asset.contentType !== "image/png" || asset.byteSize <= 0 || asset.byteSize > 15 * 1024 * 1024) {
        throw new Error("A demo image is missing or has an unsupported size.");
      }
    }

    const now = Date.now();
    const profileIds = new Map<string, Id<"profiles">>();
    for (const item of DEMO_PROFILES) {
      const normalizedUsername = item.username.toLowerCase();
      const tokenIdentifier = "codexgram-demo:" + item.username;
      const existing = await ctx.db
        .query("profiles")
        .withIndex("by_normalized_username", (q) => q.eq("normalizedUsername", normalizedUsername))
        .unique();
      if (existing && existing.tokenIdentifier !== tokenIdentifier) {
        throw new Error("A real profile already uses the demo username " + item.username + ".");
      }

      let profileId: Id<"profiles">;
      if (existing) {
        profileId = existing._id;
        await ctx.db.patch(profileId, {
          username: item.username,
          normalizedUsername,
          displayName: item.displayName,
          bio: item.bio,
          accountStatus: "active",
          updatedAt: now,
        });
      } else {
        profileId = await ctx.db.insert("profiles", {
          tokenIdentifier,
          username: item.username,
          normalizedUsername,
          displayName: item.displayName,
          bio: item.bio,
          accountStatus: "active",
          followerCount: 0,
          followingCount: 0,
          postCount: 0,
          createdAt: now,
          updatedAt: now,
        });
      }
      profileIds.set(item.username, profileId);
    }

    const uploads: Array<{ seedKey: string; assetKey: string; mediaId: Id<"media">; uploadUrl: string }> = [];
    for (const post of DEMO_POSTS) {
      const authorId = profileIds.get(post.author);
      if (!authorId) throw new Error("Missing demo author " + post.author + ".");
      const existingPosts = await ctx.db
        .query("posts")
        .withIndex("by_author_and_created_at", (q) => q.eq("authorId", authorId))
        .take(50);
      if (existingPosts.some((item) => item.caption === post.caption)) continue;

      const asset = assets.get(post.assetKey);
      if (!asset) throw new Error("Missing demo asset " + post.assetKey + ".");
      const ownerMedia = await ctx.db
        .query("media")
        .withIndex("by_owner", (q) => q.eq("ownerId", authorId))
        .take(100);
      let media = ownerMedia.find((item) => item.demoSeedKey === post.key);
      if (!media) {
        const mediaId = await ctx.db.insert("media", {
          ownerId: authorId,
          mediaType: "image",
          contentType: asset.contentType,
          byteSize: asset.byteSize,
          uploadState: "pending",
          createdAt: now,
          demoSeedKey: post.key,
        });
        media = await ctx.db.get(mediaId) ?? undefined;
      }
      if (!media) throw new Error("Could not prepare demo media.");
      if (media.contentType !== asset.contentType || media.byteSize !== asset.byteSize) {
        throw new Error("The prepared demo image does not match its fixture.");
      }
      if (media.storageId && (media.uploadState === "ready" || media.uploadState === "attached")) continue;
      uploads.push({
        seedKey: post.key,
        assetKey: post.assetKey,
        mediaId: media._id,
        uploadUrl: await ctx.storage.generateUploadUrl(),
      });
    }

    return { profiles: DEMO_PROFILES.length, expectedPosts: DEMO_POSTS.length, uploads };
  },
});

export const attachDemoUploads = internalMutation({
  args: { payload: v.array(v.number()) },
  returns: v.number(),
  handler: async (ctx, args) => {
    const payload = JSON.parse(new TextDecoder().decode(new Uint8Array(args.payload))) as { uploads: Array<[string, string, string]> };
    if (!Array.isArray(payload.uploads) || payload.uploads.length > 5 || args.payload.length > 2000) {
      throw new Error("Invalid demo upload batch.");
    }

    let attached = 0;
    for (const row of payload.uploads) {
      if (!Array.isArray(row) || row.length !== 3) throw new Error("Invalid demo upload row.");
      const [seedKey, mediaIdValue, storageIdValue] = row;
      const fixture = DEMO_POSTS.find((item) => item.key === seedKey);
      const author = fixture
        ? await ctx.db
            .query("profiles")
            .withIndex("by_normalized_username", (q) => q.eq("normalizedUsername", fixture.author))
            .unique()
        : null;
      const media = await ctx.db.get(mediaIdValue as Id<"media">);
      if (
        !fixture ||
        !author ||
        author.tokenIdentifier !== "codexgram-demo:" + fixture.author ||
        !media ||
        media.demoSeedKey !== fixture.key ||
        media.ownerId !== author._id
      ) {
        throw new Error("The uploaded demo image does not match its fixture.");
      }

      const storageId = storageIdValue as Id<"_storage">;
      const metadata = await ctx.db.system.get("_storage", storageId);
      if (!metadata || metadata.size !== media.byteSize || metadata.contentType !== media.contentType) {
        throw new Error("The uploaded demo image did not match its prepared media.");
      }
      if (media.storageId === storageId && (media.uploadState === "ready" || media.uploadState === "attached")) continue;
      await ctx.db.patch(media._id, { storageId, uploadState: "ready" });
      attached += 1;
    }
    return attached;
  },
});

export const recoverDemoUploads = internalMutation({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const demoMedia = new Map<string, Doc<"media">>();
    const usedStorageIds = new Set<Id<"_storage">>();
    for (const item of DEMO_PROFILES) {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_normalized_username", (q) => q.eq("normalizedUsername", item.username))
        .unique();
      if (!profile || profile.tokenIdentifier !== "codexgram-demo:" + item.username) continue;
      const mediaItems = await ctx.db
        .query("media")
        .withIndex("by_owner", (q) => q.eq("ownerId", profile._id))
        .take(100);
      for (const media of mediaItems) {
        if (media.demoSeedKey) demoMedia.set(media.demoSeedKey, media);
        if (media.storageId) usedStorageIds.add(media.storageId);
      }
    }

    const latestFiles = await ctx.db.system.query("_storage").order("desc").take(100);
    const availableFiles = latestFiles.filter((file) => !usedStorageIds.has(file._id));
    const recovered: string[] = [];
    for (const fixture of DEMO_POSTS) {
      const media = demoMedia.get(fixture.key);
      if (!media || (media.storageId && (media.uploadState === "ready" || media.uploadState === "attached"))) continue;
      const index = availableFiles.findIndex(
        (file) => file.size === media.byteSize && file.contentType === media.contentType,
      );
      if (index < 0) continue;
      const [file] = availableFiles.splice(index, 1);
      await ctx.db.patch(media._id, { storageId: file._id, uploadState: "ready" });
      recovered.push(fixture.key);
    }
    return recovered;
  },
});
export const finishDemoData = internalMutation({
  args: {},

  returns: v.object({
    profiles: v.number(),
    posts: v.number(),
    likesAdded: v.number(),
    commentsAdded: v.number(),
    followsAdded: v.number(),
  }),
  handler: async (ctx) => {
    const profileByUsername = new Map<string, Doc<"profiles">>();
    for (const item of DEMO_PROFILES) {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_normalized_username", (q) => q.eq("normalizedUsername", item.username))
        .unique();
      if (!profile || profile.tokenIdentifier !== "codexgram-demo:" + item.username) {
        throw new Error("Run the demo preparation step first.");
      }
      profileByUsername.set(item.username, profile);
    }


    const postsByKey = new Map<string, Doc<"posts">>();
    const addedPostsByProfile = new Map<string, number>();
    for (const fixture of DEMO_POSTS) {
      const author = profileByUsername.get(fixture.author);
      if (!author) throw new Error("Missing demo author.");
      const authorPosts = await ctx.db
        .query("posts")
        .withIndex("by_author_and_created_at", (q) => q.eq("authorId", author._id))
        .take(50);
      let post = authorPosts.find((item) => item.caption === fixture.caption);
      if (!post) {
        const ownerMedia = await ctx.db
          .query("media")
          .withIndex("by_owner", (q) => q.eq("ownerId", author._id))
          .take(100);
        const media = ownerMedia.find((item) => item.demoSeedKey === fixture.key);
        if (!media?.storageId || (media.uploadState !== "ready" && media.uploadState !== "attached")) {
          throw new Error("A demo image has not finished uploading: " + fixture.assetKey + ".");
        }
        const postId = await ctx.db.insert("posts", {
          authorId: author._id,
          mediaId: media._id,
          caption: fixture.caption,
          createdAt: Date.now() - fixture.hoursAgo * 60 * 60 * 1000,
          status: "active",
          likeCount: 0,
          commentCount: 0,
        });
        await ctx.db.patch(media._id, { uploadState: "attached" });
        post = await ctx.db.get(postId) ?? undefined;
        if (!post) throw new Error("Could not create a demo post.");
        authorPosts.push(post);
        addedPostsByProfile.set(fixture.author, (addedPostsByProfile.get(fixture.author) ?? 0) + 1);
      }
      postsByKey.set(fixture.key, post);
    }

    for (const [username, addedCount] of addedPostsByProfile) {
      const profile = profileByUsername.get(username);
      if (profile) await ctx.db.patch(profile._id, { postCount: profile.postCount + addedCount, updatedAt: Date.now() });
    }

    const followDeltas = new Map<string, { id: Id<"profiles">; following: number; followers: number }>();
    const markFollowDelta = (id: Id<"profiles">, field: "following" | "followers") => {
      const key = String(id);
      const current = followDeltas.get(key) ?? { id, following: 0, followers: 0 };
      current[field] += 1;
      followDeltas.set(key, current);
    };
    let followsAdded = 0;
    const addFollow = async (followerId: Id<"profiles">, followingId: Id<"profiles">) => {
      if (followerId === followingId) return;
      const existing = await ctx.db
        .query("follows")
        .withIndex("by_follower_and_following", (q) =>
          q.eq("followerId", followerId).eq("followingId", followingId),
        )
        .unique();
      if (existing) return;
      await ctx.db.insert("follows", { followerId, followingId, createdAt: Date.now() });
      markFollowDelta(followerId, "following");
      markFollowDelta(followingId, "followers");
      followsAdded += 1;
    };

    const demoProfiles = DEMO_PROFILES.map((item) => profileByUsername.get(item.username)).filter(
      (item): item is Doc<"profiles"> => item !== undefined,
    );
    for (let index = 0; index < demoProfiles.length; index += 1) {
      for (const step of [1, 2, 3]) {
        await addFollow(demoProfiles[index]._id, demoProfiles[(index + step) % demoProfiles.length]._id);
      }
    }

    const existingProfiles = await ctx.db.query("profiles").withIndex("by_normalized_username").take(50);
    const demoIds = new Set(demoProfiles.map((item) => String(item._id)));
    for (const profile of existingProfiles) {
      if (profile.accountStatus !== "active" || demoIds.has(String(profile._id))) continue;
      for (const demoProfile of demoProfiles) await addFollow(profile._id, demoProfile._id);
    }

    for (const delta of followDeltas.values()) {
      const profile = await ctx.db.get(delta.id);
      if (profile) {
        await ctx.db.patch(profile._id, {
          followingCount: Math.max(0, profile.followingCount + delta.following),
          followerCount: Math.max(0, profile.followerCount + delta.followers),
        });
      }
    }

    let likesAdded = 0;
    let commentsAdded = 0;
    for (let postIndex = 0; postIndex < DEMO_POSTS.length; postIndex += 1) {
      const fixture = DEMO_POSTS[postIndex];
      const post = postsByKey.get(fixture.key);
      const author = profileByUsername.get(fixture.author);
      if (!post || !author) continue;

      let newLikes = 0;
      const targetLikes = 5 + (postIndex % 3);
      for (let step = 1; newLikes < targetLikes && step < demoProfiles.length * 2; step += 1) {
        const liker = demoProfiles[(postIndex + step) % demoProfiles.length];
        if (liker._id === author._id) continue;
        const existing = await ctx.db
          .query("likes")
          .withIndex("by_post_and_profile", (q) => q.eq("postId", post._id).eq("profileId", liker._id))
          .unique();
        if (existing) continue;
        await ctx.db.insert("likes", { postId: post._id, profileId: liker._id, createdAt: Date.now() });
        newLikes += 1;
        likesAdded += 1;
      }
      if (newLikes > 0) await ctx.db.patch(post._id, { likeCount: post.likeCount + newLikes });

      const existingComments = await ctx.db
        .query("comments")
        .withIndex("by_post_and_created_at", (q) => q.eq("postId", post._id))
        .take(100);
      const existingCommentKeys = new Set(existingComments.map((item) => String(item.authorId) + "|" + item.body));
      let newComments = 0;
      const targetComments = 3;
      for (let step = 1; newComments < targetComments && step < demoProfiles.length * 2; step += 1) {
        const commenter = demoProfiles[(postIndex + step + 2) % demoProfiles.length];
        if (commenter._id === author._id) continue;
        const body = COMMENT_BODIES[(postIndex + step) % COMMENT_BODIES.length];
        const commentKey = String(commenter._id) + "|" + body;
        if (existingCommentKeys.has(commentKey)) continue;
        await ctx.db.insert("comments", {
          postId: post._id,
          authorId: commenter._id,
          body,
          createdAt: Date.now(),
        });
        existingCommentKeys.add(commentKey);

        newComments += 1;
        commentsAdded += 1;
      }
      if (newComments > 0) await ctx.db.patch(post._id, { commentCount: post.commentCount + newComments });
    }

    return {
      profiles: DEMO_PROFILES.length,
      posts: DEMO_POSTS.length,
      likesAdded,
      commentsAdded,
      followsAdded,
    };
  },
});

export const demoDataSummary = internalQuery({
  args: {},
  returns: v.object({
    profiles: v.number(),
    posts: v.number(),
    likes: v.number(),
    comments: v.number(),
    follows: v.number(),
  }),
  handler: async (ctx) => {
    const demoProfileIds = new Set<Id<"profiles">>();
    for (const item of DEMO_PROFILES) {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_normalized_username", (q) => q.eq("normalizedUsername", item.username))
        .unique();
      if (profile?.tokenIdentifier === "codexgram-demo:" + item.username) demoProfileIds.add(profile._id);
    }

    const postsById = new Map<Id<"posts">, Doc<"posts">>();
    for (const authorId of demoProfileIds) {
      const posts = await ctx.db
        .query("posts")
        .withIndex("by_author_and_created_at", (q) => q.eq("authorId", authorId))
        .take(50);
      for (const post of posts) postsById.set(post._id, post);
    }

    let likes = 0;
    let comments = 0;
    for (const post of postsById.values()) {
      likes += (await ctx.db.query("likes").withIndex("by_post_and_profile", (q) => q.eq("postId", post._id)).take(500)).length;
      comments += (await ctx.db.query("comments").withIndex("by_post_and_created_at", (q) => q.eq("postId", post._id)).take(500)).length;
    }

    const followIds = new Set<Id<"follows">>();
    for (const profileId of demoProfileIds) {
      const followers = await ctx.db.query("follows").withIndex("by_following", (q) => q.eq("followingId", profileId)).take(500);
      const following = await ctx.db.query("follows").withIndex("by_follower", (q) => q.eq("followerId", profileId)).take(500);
      for (const edge of [...followers, ...following]) followIds.add(edge._id);
    }

    return {
      profiles: demoProfileIds.size,
      posts: postsById.size,
      likes,
      comments,
      follows: followIds.size,
    };
  },
});