import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("config")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("config").collect();
    const result: Record<string, string> = {};
    for (const item of items) {
      if (item.key === "logo_url" && item.storageId) {
        // Always resolve a fresh URL from storage (never expires this way)
        const freshUrl = await ctx.storage.getUrl(item.storageId);
        result[item.key] = freshUrl ?? item.value;
      } else {
        result[item.key] = item.value;
      }
    }
    return result;
  },
});

export const set = mutation({
  args: { key: v.string(), value: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("config")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value });
    } else {
      await ctx.db.insert("config", { key: args.key, value: args.value });
    }
  },
});

export const generateLogoUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveLogoStorageId = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) return;
    const existing = await ctx.db
      .query("config")
      .withIndex("by_key", (q) => q.eq("key", "logo_url"))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { value: url, storageId: args.storageId });
    } else {
      await ctx.db.insert("config", { key: "logo_url", value: url, storageId: args.storageId });
    }
  },
});
