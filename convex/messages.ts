import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { requireProfile } from "./lib/auth";

const participant = v.object({
  _id: v.id("profiles"),
  username: v.string(),
  displayName: v.string(),
  avatarUrl: v.union(v.string(), v.null()),
});

const conversationPreview = v.object({
  conversationId: v.id("conversations"),
  otherUser: participant,
  lastMessage: v.union(
    v.object({
      body: v.string(),
      createdAt: v.number(),
      isMine: v.boolean(),
    }),
    v.null(),
  ),
  lastMessageAt: v.number(),
});

const chatMessage = v.object({
  _id: v.id("messages"),
  senderId: v.id("profiles"),
  senderName: v.string(),
  senderAvatarUrl: v.union(v.string(), v.null()),
  body: v.string(),
  createdAt: v.number(),
  isMine: v.boolean(),
});

async function findOrCreateConversation(
  ctx: MutationCtx,
  viewer: Doc<"profiles">,
  otherUserId: Id<"profiles">,
): Promise<Id<"conversations">> {
  if (viewer._id === otherUserId) throw new Error("You cannot message yourself.");

  const otherUser = await ctx.db.get(otherUserId);
  if (!otherUser || otherUser.accountStatus !== "active") {
    throw new Error("This profile is unavailable.");
  }

  const [member1Id, member2Id] =
    viewer._id < otherUser._id ? [viewer._id, otherUser._id] : [otherUser._id, viewer._id];
  const existing = await ctx.db
    .query("conversations")
    .withIndex("by_member1_and_member2", (q) =>
      q.eq("member1Id", member1Id).eq("member2Id", member2Id),
    )
    .unique();
  if (existing) return existing._id;

  const follow = await ctx.db
    .query("follows")
    .withIndex("by_follower_and_following", (q) =>
      q.eq("followerId", viewer._id).eq("followingId", otherUser._id),
    )
    .unique();
  if (!follow) throw new Error("Follow this person before starting a conversation.");

  const now = Date.now();
  return await ctx.db.insert("conversations", {
    member1Id,
    member2Id,
    createdAt: now,
    updatedAt: now,
    lastMessageAt: now,
  });
}

export const getMyConversations = query({
  args: {},
  returns: v.array(conversationPreview),
  handler: async (ctx) => {
    const viewer = await requireProfile(ctx);
    const [asMember1, asMember2] = await Promise.all([
      ctx.db
        .query("conversations")
        .withIndex("by_member1_and_last_message_at", (q) => q.eq("member1Id", viewer._id))
        .order("desc")
        .take(50),
      ctx.db
        .query("conversations")
        .withIndex("by_member2_and_last_message_at", (q) => q.eq("member2Id", viewer._id))
        .order("desc")
        .take(50),
    ]);
    const conversations = [...asMember1, ...asMember2]
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt)
      .filter((conversation, index, all) =>
        all.findIndex((item) => item._id === conversation._id) === index,
      )
      .slice(0, 50);

    const results = await Promise.all(
      conversations.map(async (conversation) => {
        const otherUserId =
          conversation.member1Id === viewer._id ? conversation.member2Id : conversation.member1Id;
        const otherUser = await ctx.db.get(otherUserId);
        if (!otherUser || otherUser.accountStatus !== "active") return null;

        const lastMessage = await ctx.db
          .query("messages")
          .withIndex("by_conversation_and_created_at", (q) =>
            q.eq("conversationId", conversation._id),
          )
          .order("desc")
          .first();

        return {
          conversationId: conversation._id,
          otherUser: {
            _id: otherUser._id,
            username: otherUser.username,
            displayName: otherUser.displayName,
            avatarUrl: otherUser.avatarUrl ?? null,
          },
          lastMessage: lastMessage
            ? {
                body: lastMessage.body,
                createdAt: lastMessage.createdAt,
                isMine: lastMessage.senderId === viewer._id,
              }
            : null,
          lastMessageAt: conversation.lastMessageAt,
        };
      }),
    );

    return results.filter((result): result is NonNullable<typeof result> => result !== null);
  },
});

export const getMessages = query({
  args: { conversationId: v.id("conversations") },
  returns: v.object({ otherUser: participant, messages: v.array(chatMessage) }),
  handler: async (ctx, args) => {
    const viewer = await requireProfile(ctx);
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("This conversation is unavailable.");

    const isMember = conversation.member1Id === viewer._id || conversation.member2Id === viewer._id;
    if (!isMember) throw new Error("You do not have access to this conversation.");

    const otherUserId =
      conversation.member1Id === viewer._id ? conversation.member2Id : conversation.member1Id;
    const otherUser = await ctx.db.get(otherUserId);
    if (!otherUser || otherUser.accountStatus !== "active") {
      throw new Error("This profile is unavailable.");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_and_created_at", (q) =>
        q.eq("conversationId", conversation._id),
      )
      .order("desc")
      .take(100);
    const hydrated = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        if (!sender || sender.accountStatus !== "active") return null;
        return {
          _id: message._id,
          senderId: sender._id,
          senderName: sender.displayName,
          senderAvatarUrl: sender.avatarUrl ?? null,
          body: message.body,
          createdAt: message.createdAt,
          isMine: message.senderId === viewer._id,
        };
      }),
    );

    return {
      otherUser: {
        _id: otherUser._id,
        username: otherUser.username,
        displayName: otherUser.displayName,
        avatarUrl: otherUser.avatarUrl ?? null,
      },
      messages: hydrated
        .filter((message): message is NonNullable<typeof message> => message !== null)
        .reverse(),
    };
  },
});

export const getOrCreateConversation = mutation({
  args: { otherUserId: v.id("profiles") },
  returns: v.id("conversations"),
  handler: async (ctx, args) => {
    const viewer = await requireProfile(ctx);
    return await findOrCreateConversation(ctx, viewer, args.otherUserId);
  },
});

export const sendMessage = mutation({
  args: {
    conversationId: v.optional(v.id("conversations")),
    otherUserId: v.optional(v.id("profiles")),
    body: v.string(),
  },
  returns: v.object({
    conversationId: v.id("conversations"),
    messageId: v.id("messages"),
  }),
  handler: async (ctx, args) => {
    const viewer = await requireProfile(ctx);
    if (Boolean(args.conversationId) === Boolean(args.otherUserId)) {
      throw new Error("Provide either a conversation or a recipient.");
    }

    const body = args.body.trim();
    if (!body || body.length > 4000) {
      throw new Error("Messages must be between 1 and 4,000 characters.");
    }

    const conversationId = args.conversationId ??
      (args.otherUserId
        ? await findOrCreateConversation(ctx, viewer, args.otherUserId)
        : null);
    if (!conversationId) throw new Error("A conversation is required.");

    const conversation = await ctx.db.get(conversationId);
    if (!conversation) throw new Error("This conversation is unavailable.");
    const isMember = conversation.member1Id === viewer._id || conversation.member2Id === viewer._id;
    if (!isMember) throw new Error("You do not have access to this conversation.");

    const now = Date.now();
    const messageId = await ctx.db.insert("messages", {
      conversationId: conversation._id,
      senderId: viewer._id,
      body,
      createdAt: now,
    });
    await ctx.db.patch(conversation._id, { updatedAt: now, lastMessageAt: now });
    return { conversationId: conversation._id, messageId };
  },
});
