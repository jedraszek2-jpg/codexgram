import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireProfile } from "./lib/auth";

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

function validateUpload(args: {
  mediaType: "image" | "video";
  contentType: string;
  byteSize: number;
  durationSeconds?: number;
}) {
  const maxBytes = args.mediaType === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  const allowedTypes =
    args.mediaType === "image"
      ? ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]
      : ["video/mp4", "video/quicktime"];

  if (!allowedTypes.includes(args.contentType)) {
    throw new Error("This file type is not supported.");
  }
  if (!Number.isFinite(args.byteSize) || args.byteSize <= 0 || args.byteSize > maxBytes) {
    throw new Error(args.mediaType === "image" ? "Photos must be 15 MB or smaller." : "Videos must be 50 MB or smaller.");
  }
  if (
    args.mediaType === "video" &&
    (!args.durationSeconds || args.durationSeconds <= 0 || args.durationSeconds > 30)
  ) {
    throw new Error("Videos must be 30 seconds or shorter.");
  }
}

export const generateUploadUrl = mutation({
  args: {
    mediaType: v.union(v.literal("image"), v.literal("video")),
    contentType: v.string(),
    byteSize: v.number(),
    durationSeconds: v.optional(v.number()),
  },
  returns: v.object({ mediaId: v.id("media"), uploadUrl: v.string() }),
  handler: async (ctx, args) => {
    const owner = await requireProfile(ctx);
    validateUpload(args);

    const mediaId = await ctx.db.insert("media", {
      ownerId: owner._id,
      mediaType: args.mediaType,
      contentType: args.contentType,
      byteSize: args.byteSize,
      ...(args.durationSeconds ? { durationSeconds: args.durationSeconds } : {}),
      uploadState: "pending",
      createdAt: Date.now(),
    });
    const uploadUrl = await ctx.storage.generateUploadUrl();
    return { mediaId, uploadUrl };
  },
});

export const finalizeUpload = mutation({
  args: { mediaId: v.id("media"), storageId: v.id("_storage") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const owner = await requireProfile(ctx);
    const media = await ctx.db.get(args.mediaId);
    if (!media || media.ownerId !== owner._id) {
      throw new Error("This upload is unavailable.");
    }
    if (media.uploadState === "ready" || media.uploadState === "attached") {
      return null;
    }

    const metadata = await ctx.db.system.get("_storage", args.storageId);
    const maxBytes = media.mediaType === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
    if (
      !metadata ||
      metadata.size !== media.byteSize ||
      metadata.size > maxBytes ||
      metadata.contentType !== media.contentType
    ) {
      throw new Error("The uploaded file did not match the selected media. Please try again.");
    }
    if (
      media.mediaType === "video" &&
      (!media.durationSeconds || media.durationSeconds <= 0 || media.durationSeconds > 30)
    ) {
      throw new Error("Videos must be 30 seconds or shorter.");
    }

    await ctx.db.patch(media._id, {
      storageId: args.storageId,
      uploadState: "ready",
    });
    return null;
  },
});
