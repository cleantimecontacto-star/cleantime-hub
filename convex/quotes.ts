import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("quotes")
      .withIndex("by_deletedAt", (q) => q.eq("deletedAt", undefined))
      .order("desc")
      .collect();
  },
});

export const listWithProject = query({
  args: {},
  handler: async (ctx) => {
    const quotes = await ctx.db
      .query("quotes")
      .withIndex("by_deletedAt", (q) => q.eq("deletedAt", undefined))
      .order("desc")
      .collect();
    
    return await Promise.all(
      quotes.map(async (q) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let projectInfo: any = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let clientInfo: any = null;
        if (q.projectId) {
          const project = await ctx.db.get(q.projectId);
          if (project) {
            projectInfo = project;
            if (project.clientId) {
              clientInfo = await ctx.db.get(project.clientId);
            }
          }
        }
        return {
          ...q,
          projectInfo,
          clientInfo,
        };
      })
    );
  },
});

export const get = query({
  args: { id: v.id("quotes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    clientId: v.id("clients"),
    clientName: v.string(),
    projectId: v.optional(v.id("projects")),
    projectName: v.optional(v.string()),
    projectAddress: v.optional(v.string()),
    serviceType: v.string(),
    description: v.optional(v.string()),
    squareMeters: v.number(),
    pricePerM2: v.number(),
    subtotal: v.number(),
    iva: v.number(),
    total: v.number(),
    includesSupplies: v.boolean(),
    excessiveDirt: v.boolean(),
    suppliesPct: v.optional(v.number()),
    excessiveDirtPct: v.optional(v.number()),
    notes: v.optional(v.string()),
    status: v.union(
      v.literal("Pendiente"),
      v.literal("Aprobada"),
      v.literal("Rechazada"),
      v.literal("Facturada")
    ),
    date: v.string(),
    terms: v.optional(v.string()),
    unit: v.optional(v.string()),
    otNumber: v.optional(v.string()),
    invoiceNumber: v.optional(v.string()),
    paymentStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const finalArgs = { ...args };
    if (args.projectId && !args.projectName) {
      const project = await ctx.db.get(args.projectId);
      if (project) {
        finalArgs.projectName = project.name;
        if (project.address) finalArgs.projectAddress = project.address;
      }
    }
    
    // Generación de número de cotización optimizada
    const year = new Date().getFullYear();
    const lastQuote = await ctx.db
      .query("quotes")
      .withIndex("by_date")
      .order("desc")
      .filter(q => q.regex(q.field("number"), `^COT${year}`))
      .first();
    
    let num = 1;
    if (lastQuote) {
      const parts = lastQuote.number.split("/");
      const lastNum = parseInt(parts[parts.length - 1]);
      if (!isNaN(lastNum)) num = lastNum + 1;
    }
    
    const number = `COT${year}/${num}`;
    return await ctx.db.insert("quotes", { ...finalArgs, number });
  },
});

export const update = mutation({
  args: {
    id: v.id("quotes"),
    clientId: v.id("clients"),
    clientName: v.string(),
    projectId: v.optional(v.id("projects")),
    projectName: v.optional(v.string()),
    projectAddress: v.optional(v.string()),
    serviceType: v.string(),
    description: v.optional(v.string()),
    squareMeters: v.number(),
    pricePerM2: v.number(),
    subtotal: v.number(),
    iva: v.number(),
    total: v.number(),
    includesSupplies: v.boolean(),
    excessiveDirt: v.boolean(),
    suppliesPct: v.optional(v.number()),
    excessiveDirtPct: v.optional(v.number()),
    notes: v.optional(v.string()),
    status: v.union(
      v.literal("Pendiente"),
      v.literal("Aprobada"),
      v.literal("Rechazada"),
      v.literal("Facturada")
    ),
    date: v.string(),
    terms: v.optional(v.string()),
    unit: v.optional(v.string()),
    otNumber: v.optional(v.string()),
    invoiceNumber: v.optional(v.string()),
    paymentStatus: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...rest }) => {
    const finalRest = { ...rest };
    if (rest.projectId && !rest.projectName) {
      const project = await ctx.db.get(rest.projectId);
      if (project) {
        finalRest.projectName = project.name;
        if (project.address) finalRest.projectAddress = project.address;
      }
    }
    await ctx.db.patch(id, finalRest);
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("quotes"),
    status: v.union(
      v.literal("Pendiente"),
      v.literal("Aprobada"),
      v.literal("Rechazada"),
      v.literal("Facturada")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

/** Soft delete: la cotización y sus jobs/gastos asociados van a la papelera. */
export const remove = mutation({
  args: { id: v.id("quotes") },
  handler: async (ctx, args) => {
    const ts = Date.now();
    const jobs = await ctx.db
      .query("workerJobs")
      .withIndex("by_quote", (q) => q.eq("quoteId", args.id))
      .collect();
    for (const job of jobs) {
      if (!job.deletedAt) await ctx.db.patch(job._id, { deletedAt: ts });
    }
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_quote", (q) => q.eq("quoteId", args.id))
      .collect();
    for (const exp of expenses) {
      if (!exp.deletedAt) await ctx.db.patch(exp._id, { deletedAt: ts });
    }
    await ctx.db.patch(args.id, { deletedAt: ts });
  },
});

export const duplicate = mutation({
  args: { id: v.id("quotes") },
  handler: async (ctx, args) => {
    const original = await ctx.db.get(args.id);
    if (!original) throw new Error("Cotización no encontrada");
    
    const year = new Date().getFullYear();
    const lastQuote = await ctx.db
      .query("quotes")
      .withIndex("by_date")
      .order("desc")
      .filter(q => q.regex(q.field("number"), `^COT${year}`))
      .first();
    
    let num = 1;
    if (lastQuote) {
      const parts = lastQuote.number.split("/");
      const lastNum = parseInt(parts[parts.length - 1]);
      if (!isNaN(lastNum)) num = lastNum + 1;
    }
    
    const number = `COT${year}/${num}`;
    const {
      _id,
      _creationTime,
      number: _num,
      deletedAt: _deletedAt,
      ...rest
    } = original;
    return await ctx.db.insert("quotes", {
      ...rest,
      number,
      status: "Pendiente",
    });
  },
});
