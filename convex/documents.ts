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
    // Soft delete all docs in this category (they go to papelera)
    const ts = Date.now();
    const docs = await ctx.db
      .query("documents")
      .withIndex("by_category", (q) => q.eq("categoryId", id))
      .collect();
    for (const doc of docs) {
      if (!doc.deletedAt) await ctx.db.patch(doc._id, { deletedAt: ts });
    }
    await ctx.db.delete(id);
  },
});

// ── Documentos ───────────────────────────────────────────────────────────────

export const listDocuments = query({
  args: { categoryId: v.optional(v.id("docCategories")) },
  handler: async (ctx, { categoryId }) => {
    // Usamos el índice by_deletedAt para filtrar solo los documentos activos (deletedAt === undefined)
    const query = ctx.db
      .query("documents")
      .withIndex("by_deletedAt", (q) => q.eq("deletedAt", undefined));

    const docs = categoryId
      ? await query.filter((q) => q.eq(q.field("categoryId"), categoryId)).collect()
      : await query.collect();

    return docs;
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

/** Soft delete: el documento pasa a la papelera. El archivo en storage se conserva hasta el purge definitivo. */
export const deleteDocument = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, { id }) => {
    const doc = await ctx.db.get(id);
    if (doc) {
      await ctx.db.patch(id, { deletedAt: Date.now() });
    }
  },
});

export const getDownloadUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId);
  },
});
