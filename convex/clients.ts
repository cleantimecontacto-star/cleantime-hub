import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("clients").order("asc").collect();
    return all.filter(c => !c.archived);
  },
});

export const listArchived = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("clients").order("asc").collect();
    return all.filter(c => c.archived === true);
  },
});

export const archive = mutation({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { archived: true });
  },
});

export const unarchive = mutation({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { archived: false });
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    rut: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("clients", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("clients"),
    name: v.string(),
    rut: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...rest }) => {
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    // Cascade: delete all projects of this client
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_client", q => q.eq("clientId", args.id))
      .collect();
    for (const project of projects) {
      await ctx.db.delete(project._id);
    }
    // Cascade: delete all quotes of this client + their dependents
    const quotes = await ctx.db
      .query("quotes")
      .filter(q => q.eq(q.field("clientId"), args.id))
      .collect();
    for (const quote of quotes) {
      // Delete worker jobs linked to this quote
      const jobs = await ctx.db
        .query("workerJobs")
        .withIndex("by_quote", q => q.eq("quoteId", quote._id))
        .collect();
      for (const job of jobs) await ctx.db.delete(job._id);
      // Delete expenses linked to this quote
      const expenses = await ctx.db
        .query("expenses")
        .withIndex("by_quote", q => q.eq("quoteId", quote._id))
        .collect();
      for (const exp of expenses) await ctx.db.delete(exp._id);
      await ctx.db.delete(quote._id);
    }
    await ctx.db.delete(args.id);
  },
});
