import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("workers")
      .withIndex("by_deletedAt", (q) => q.eq("deletedAt", undefined))
      .order("asc")
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    phone: v.optional(v.string()),
    paymentType: v.union(
      v.literal("por_dia"),
      v.literal("a_trato"),
      v.literal("por_m2")
    ),
    rateAmount: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("workers", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("workers"),
    name: v.string(),
    phone: v.optional(v.string()),
    paymentType: v.union(
      v.literal("por_dia"),
      v.literal("a_trato"),
      v.literal("por_m2")
    ),
    rateAmount: v.number(),
  },
  handler: async (ctx, { id, ...rest }) => {
    await ctx.db.patch(id, rest);
  },
});

/** Soft delete: el trabajador pasa a la papelera. */
export const remove = mutation({
  args: { id: v.id("workers") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { deletedAt: Date.now() });
  },
});

export const listJobs = query({
  args: { workerId: v.id("workers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workerJobs")
      .withIndex("by_worker", (q) => q.eq("workerId", args.workerId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();
  },
});

export const allJobs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("workerJobs")
      .withIndex("by_deletedAt", (q) => q.eq("deletedAt", undefined))
      .order("desc")
      .collect();
  },
});

export const createJob = mutation({
  args: {
    workerId: v.id("workers"),
    quoteId: v.optional(v.id("quotes")),
    description: v.string(),
    amount: v.number(),
    paid: v.boolean(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("workerJobs", args);
  },
});

export const updateJob = mutation({
  args: {
    id: v.id("workerJobs"),
    description: v.string(),
    amount: v.number(),
    paid: v.boolean(),
    date: v.string(),
    quoteId: v.optional(v.id("quotes")),
  },
  handler: async (ctx, { id, ...rest }) => {
    await ctx.db.patch(id, rest);
  },
});

export const markJobPaid = mutation({
  args: { id: v.id("workerJobs"), paid: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { paid: args.paid });
  },
});

/** Soft delete: el trabajo pasa a la papelera. */
export const removeJob = mutation({
  args: { id: v.id("workerJobs") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { deletedAt: Date.now() });
  },
});
