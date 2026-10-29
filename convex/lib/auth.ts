import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export async function requireIdentity(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Sign in to continue.");
  }
  return identity;
}

export async function requireProfile(ctx: QueryCtx | MutationCtx): Promise<Doc<"profiles">> {
  const identity = await requireIdentity(ctx);
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();

  if (!profile || profile.accountStatus !== "active") {
    throw new Error("Your profile is not ready yet.");
  }
  return profile;
}