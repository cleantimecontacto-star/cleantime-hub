import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByClient = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projects")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .order("asc")
      .collect();
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("projects").order("asc").collect();
  },
});

export const listWithClient = query({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db.query("projects").order("asc").collect();
    const withClients = await Promise.all(
      projects.map(async (p) => {
        const client = p.clientId ? await ctx.db.get(p.clientId) : null;
        return { ...p, clientName: client?.name ?? "Sin cliente" };
      })
    );
    return withClients;
  },
});

export const get = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    clientId: v.id("clients"),
    name: v.string(),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("projects", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("projects"),
    name: v.string(),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...rest }) => {
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const profitability = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    // All quotes linked to this project
    const projectQuotes = await ctx.db
      .query("quotes")
      .filter(q => q.eq(q.field("projectId"), args.projectId))
      .collect();

    const approvedQuotes = projectQuotes.filter(q => q.status === "Aprobada");
    const totalCotizado = projectQuotes.reduce((s, q) => s + q.total, 0);
    const totalAprobado = approvedQuotes.reduce((s, q) => s + q.total, 0);

    // Worker costs for quotes in this project
    let workerCosts = 0;
    for (const quote of projectQuotes) {
      const jobs = await ctx.db
        .query("workerJobs")
        .withIndex("by_quote", q => q.eq("quoteId", quote._id))
        .collect();
      workerCosts += jobs.reduce((s, j) => s + j.amount, 0);
    }

    // Expenses for quotes in this project
    let expenseCosts = 0;
    for (const quote of projectQuotes) {
      const exps = await ctx.db
        .query("expenses")
        .withIndex("by_quote", q => q.eq("quoteId", quote._id))
        .collect();
      expenseCosts += exps.reduce((s, e) => s + e.amount, 0);
    }

    const totalGastos = workerCosts + expenseCosts;
    const gananciaNeta = totalAprobado - totalGastos;

    return {
      quoteCount: projectQuotes.length,
      approvedCount: approvedQuotes.length,
      totalCotizado,
      totalAprobado,
      workerCosts,
      expenseCosts,
      totalGastos,
      gananciaNeta,
    };
  },
});
