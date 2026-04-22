import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("serviceTypes").withIndex("by_order").order("asc").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    pricePerM2: v.optional(v.number()),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("serviceTypes", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("serviceTypes"),
    name: v.string(),
    pricePerM2: v.optional(v.number()),
  },
  handler: async (ctx, { id, name, pricePerM2 }) => {
    const existing = await ctx.db.get(id);
    if (!existing) return;
    const doc: { name: string; pricePerM2?: number; order: number } = {
      name,
      order: existing.order,
    };
    if (pricePerM2 !== undefined && !isNaN(pricePerM2)) {
      doc.pricePerM2 = pricePerM2;
    }
    await ctx.db.replace(id, doc);
  },
});

export const remove = mutation({
  args: { id: v.id("serviceTypes") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
