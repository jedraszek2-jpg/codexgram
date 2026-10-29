import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireProfile } from "./lib/auth";

const activityType = v.union(v.literal("like"), v.literal("comment"), v.literal("follow"));

const activityResult = v.object({
  _id: v.id("activities"),
  type: activityType,
  postId: v.union(v.id("posts"), v.null()),
  createdAt: v.number(),
  isRead: v.boolean(),
  actor: v.object({
    _id: v.id("profiles"),
    username: v.string(),
    displayName: v.string(),
    avatarUrl: v.union(v.string(), v.null()),
  }),
});

export const getMyActivities = query({
  args: {},
  returns: v.array(activityResult),
  handler: async (ctx) => {
    const viewer = await requireProfile(ctx);
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_recipient_and_created_at", (q) => q.eq("recipientId", viewer._id))
      .order("desc")
      .take(100);

    const hydrated = await Promise.all(
      activities.map(async (activity) => {
        const actor = await ctx.db.get(activity.actorId);
        if (!actor || actor.accountStatus !== "active") return null;

        return {
          _id: activity._id,
          type: activity.type,
          postId: activity.postId ?? null,
          createdAt: activity.createdAt,
          isRead: activity.isRead,
          actor: {
            _id: actor._id,
            username: actor.username,
            displayName: actor.displayName,
            avatarUrl: actor.avatarUrl ?? null,
          },
        };
      }),
    );

    return hydrated.filter((activity): activity is NonNullable<typeof activity> => activity !== null);
  },
});
