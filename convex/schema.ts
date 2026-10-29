import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  profiles: defineTable({
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
  })
    .index("by_token_identifier", ["tokenIdentifier"])
    .index("by_normalized_username", ["normalizedUsername"]),

  follows: defineTable({
    followerId: v.id("profiles"),
    followingId: v.id("profiles"),
    createdAt: v.number(),
  })
    .index("by_follower_and_following", ["followerId", "followingId"])
    .index("by_follower", ["followerId"])
    .index("by_following", ["followingId"]),

  media: defineTable({
    ownerId: v.id("profiles"),
    storageId: v.optional(v.id("_storage")),
    demoSeedKey: v.optional(v.string()),
    mediaType: v.union(v.literal("image"), v.literal("video")),
    contentType: v.string(),
    byteSize: v.number(),
    durationSeconds: v.optional(v.number()),
    uploadState: v.union(v.literal("pending"), v.literal("ready"), v.literal("attached")),
    createdAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_upload_state", ["uploadState"]),

  posts: defineTable({
    authorId: v.id("profiles"),
    mediaId: v.id("media"),
    caption: v.optional(v.string()),
    createdAt: v.number(),
    status: v.union(v.literal("active"), v.literal("hidden")),
    likeCount: v.number(),
    commentCount: v.number(),
  })
    .index("by_author_and_created_at", ["authorId", "createdAt"])
    .index("by_created_at", ["createdAt"]),

  likes: defineTable({
    postId: v.id("posts"),
    profileId: v.id("profiles"),
    createdAt: v.number(),
  })
    .index("by_post_and_profile", ["postId", "profileId"])
    .index("by_profile", ["profileId"]),

  comments: defineTable({
    postId: v.id("posts"),
    authorId: v.id("profiles"),
    body: v.string(),
    createdAt: v.number(),
  })
    .index("by_post_and_created_at", ["postId", "createdAt"])
    .index("by_author", ["authorId"]),
});