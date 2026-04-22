import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("expenses").order("desc").collect();
  },
});

export const create = mutation({
  args: {
    category: v.string(),
    description: v.string(),
    amount: v.number(),
    date: v.string(),
    quoteId: v.optional(v.id("quotes")),
    quoteName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("expenses", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("expenses"),
    category: v.string(),
    description: v.string(),
    amount: v.number(),
    date: v.string(),
    quoteId: v.optional(v.id("quotes")),
    quoteName: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...rest }) => {
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("expenses") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const listCategories = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("expenseCategories").order("asc").collect();
  },
});

export const createCategory = mutation({
  args: { name: v.string(), order: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("expenseCategories", args);
  },
});

export const updateCategory = mutation({
  args: { id: v.id("expenseCategories"), name: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { name: args.name });
  },
});

export const removeCategory = mutation({
  args: { id: v.id("expenseCategories") },
  handler: async (ctx, args) => {
    const cat = await ctx.db.get(args.id);
    if (!cat) return;
    // Move all expenses from this category to "Sin categoría" so they aren't orphaned
    const affected = await ctx.db
      .query("expenses")
      .withIndex("by_category", (q) => q.eq("category", cat.name))
      .collect();
    for (const exp of affected) {
      await ctx.db.patch(exp._id, { category: "Sin categoría" });
    }
    await ctx.db.delete(args.id);
  },
});
