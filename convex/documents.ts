import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ── Categorías ──────────────────────────────────────────────────────────────

export const listCategories = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("docCategories")
      .withIndex("by_order")
      .collect();
  },
});

export const addCategory = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const all = await ctx.db.query("docCategories").collect();
    const maxOrder = all.length > 0 ? Math.max(...all.map((c) => c.order)) : 0;
    return await ctx.db.insert("docCategories", { name, order: maxOrder + 1 });
  },
});

export const renameCategory = mutation({
  args: { id: v.id("docCategories"), name: v.string() },
  handler: async (ctx, { id, name }) => {
    await ctx.db.patch(id, { name });
  },
});

export const deleteCategory = mutation({
  args: { id: v.id("docCategories") },
  handler: async (ctx, { id }) => {
    // Move docs in this category to "Sin categoría" or delete them
    const docs = await ctx.db
      .query("documents")
      .withIndex("by_category", (q) => q.eq("categoryId", id))
      .collect();
    for (const doc of docs) {
      await ctx.storage.delete(doc.storageId);
      await ctx.db.delete(doc._id);
    }
    await ctx.db.delete(id);
  },
});

// ── Documentos ───────────────────────────────────────────────────────────────

export const listDocuments = query({
  args: { categoryId: v.optional(v.id("docCategories")) },
  handler: async (ctx, { categoryId }) => {
    if (categoryId) {
      return await ctx.db
        .query("documents")
        .withIndex("by_category", (q) => q.eq("categoryId", categoryId))
        .collect();
    }
    return await ctx.db.query("documents").collect();
  },
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveDocument = mutation({
  args: {
    name: v.string(),
    categoryId: v.id("docCategories"),
    storageId: v.id("_storage"),
    fileType: v.string(),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("documents", {
      ...args,
      uploadedAt: new Date().toISOString(),
    });
  },
});

export const deleteDocument = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, { id }) => {
    const doc = await ctx.db.get(id);
    if (doc) {
      await ctx.storage.delete(doc.storageId);
      await ctx.db.delete(id);
    }
  },
});

export const getDownloadUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId);
  },
});
