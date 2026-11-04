"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

export const deleteClerkUser = action({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("You must be signed in to delete your account.");

    const userId = identity.subject;
    if (!userId.startsWith("user_")) {
      throw new Error("The signed-in identity is not a Clerk user.");
    }

    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) throw new Error("CLERK_SECRET_KEY is not configured in Convex.");

    const response = await fetch(
      `https://api.clerk.com/v1/users/${encodeURIComponent(userId)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${secretKey}` },
      },
    );
    if (!response.ok) {
      throw new Error(`Clerk could not delete the account (HTTP ${response.status}).`);
    }

    return null;
  },
});
