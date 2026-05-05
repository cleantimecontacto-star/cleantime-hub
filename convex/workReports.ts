import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const reports = await ctx.db
      .query("workReports")
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();
    return reports;
  },
});

export const getByQuote = query({
  args: { quoteId: v.id("quotes") },
  handler: async (ctx, args) => {
    const report = await ctx.db
      .query("workReports")
      .withIndex("by_quote", (q) => q.eq("quoteId", args.quoteId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .first();
    return report;
  },
});

export const get = query({
  args: { id: v.id("workReports") },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.id);
    if (!report || report.deletedAt) return null;
    return report;
  },
});

export const create = mutation({
  args: {
    quoteId: v.id("quotes"),
    quoteName: v.string(),
    clientName: v.string(),
    projectName: v.optional(v.string()),
    projectAddress: v.optional(v.string()),
    serviceType: v.string(),
    workDates: v.string(),
    previousState: v.string(),
    workSummary: v.string(),
    photos: v.array(
      v.object({
        storageId: v.id("_storage"),
        caption: v.string(),
        uploadedAt: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("workReports", {
      quoteId: args.quoteId,
      quoteName: args.quoteName,
      clientName: args.clientName,
      projectName: args.projectName,
      projectAddress: args.projectAddress,
      serviceType: args.serviceType,
      workDates: args.workDates,
      previousState: args.previousState,
      workSummary: args.workSummary,
      photos: args.photos,
      createdAt: new Date().toISOString(),
    });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("workReports"),
    workDates: v.optional(v.string()),
    previousState: v.optional(v.string()),
    workSummary: v.optional(v.string()),
    photos: v.optional(
      v.array(
        v.object({
          storageId: v.id("_storage"),
          caption: v.string(),
          uploadedAt: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.id);
    if (!report || report.deletedAt) return null;

    const updates: any = {};
    if (args.workDates !== undefined) updates.workDates = args.workDates;
    if (args.previousState !== undefined) updates.previousState = args.previousState;
    if (args.workSummary !== undefined) updates.workSummary = args.workSummary;
    if (args.photos !== undefined) updates.photos = args.photos;

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id("workReports") },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.id);
    if (!report) return null;
    await ctx.db.patch(args.id, { deletedAt: Date.now() });
    return args.id;
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getPhotoUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
