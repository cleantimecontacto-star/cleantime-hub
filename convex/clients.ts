import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("clients").order("asc").collect();
    return all.filter((c) => !c.archived && !c.deletedAt);
  },
});

export const listArchived = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("clients").order("asc").collect();
    return all.filter((c) => c.archived === true && !c.deletedAt);
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

/**
 * Soft delete: el cliente y sus dependencias (proyectos, cotizaciones,
 * jobs y gastos asociados) pasan a la papelera. Se pueden restaurar.
 */
export const remove = mutation({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    const ts = Date.now();
    // Cascade soft-delete: projects of this client
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_client", (q) => q.eq("clientId", args.id))
      .collect();
    for (const project of projects) {
      if (!project.deletedAt) {
        await ctx.db.patch(project._id, { deletedAt: ts });
      }
    }
    // Cascade soft-delete: quotes of this client + their dependents
    const quotes = await ctx.db
      .query("quotes")
      .filter((q) => q.eq(q.field("clientId"), args.id))
      .collect();
    for (const quote of quotes) {
      if (!quote.deletedAt) {
        await ctx.db.patch(quote._id, { deletedAt: ts });
      }
      const jobs = await ctx.db
        .query("workerJobs")
        .withIndex("by_quote", (q) => q.eq("quoteId", quote._id))
        .collect();
      for (const job of jobs) {
        if (!job.deletedAt) await ctx.db.patch(job._id, { deletedAt: ts });
      }
      const expenses = await ctx.db
        .query("expenses")
        .withIndex("by_quote", (q) => q.eq("quoteId", quote._id))
        .collect();
      for (const exp of expenses) {
        if (!exp.deletedAt) await ctx.db.patch(exp._id, { deletedAt: ts });
      }
    }
    await ctx.db.patch(args.id, { deletedAt: ts });
  },
});
