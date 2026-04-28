import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Papelera de reciclaje - Gestión unificada para OPS y RRHH.
 * Recupera todos los elementos que tengan el campo 'deletedAt' definido.
 */

export const list = query({
  args: {},
  handler: async (ctx) => {
    // Tablas a consultar en la papelera
    const tables = [
      "clients",
      "projects",
      "quotes",
      "workers",
      "workerJobs",
      "expenses",
      "documents",
      "serviceTypes",
      "docCategories",
      "expenseCategories"
    ];

    const allDeletedItems = [];

    for (const table of tables) {
      const deleted = await ctx.db
        .query(table as any)
        .withIndex("by_deletedAt", (q) => q.gt("deletedAt", 0))
        .collect();
      
      // Mapeamos los items para que el frontend sepa de qué tabla vienen
      allDeletedItems.push(...deleted.map(item => ({
        ...item,
        type: table // Identificador para el frontend
      })));
    }

    // Ordenar por fecha de eliminación (más reciente primero)
    return allDeletedItems.sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
  },
});

export const getDeletedItems = query({
  args: {},
  handler: async (ctx) => {
    // Alias de 'list' para compatibilidad con nuevas versiones del frontend
    const tables = ["clients", "projects", "quotes", "workers", "workerJobs", "expenses", "documents"];
    const all = [];
    for (const table of tables) {
      const deleted = await ctx.db.query(table as any).withIndex("by_deletedAt", (q) => q.gt("deletedAt", 0)).collect();
      all.push(...deleted.map(i => ({ ...i, type: table })));
    }
    return all.sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
  },
});

// Mutaciones necesarias para el frontend
export const restoreClient = mutation({ args: { id: v.id("clients") }, handler: async (ctx, args) => { await ctx.db.patch(args.id, { deletedAt: undefined }); } });
export const restoreProject = mutation({ args: { id: v.id("projects") }, handler: async (ctx, args) => { await ctx.db.patch(args.id, { deletedAt: undefined }); } });
export const restoreQuote = mutation({ args: { id: v.id("quotes") }, handler: async (ctx, args) => { await ctx.db.patch(args.id, { deletedAt: undefined }); } });
export const restoreWorker = mutation({ args: { id: v.id("workers") }, handler: async (ctx, args) => { await ctx.db.patch(args.id, { deletedAt: undefined }); } });
export const restoreJob = mutation({ args: { id: v.id("workerJobs") }, handler: async (ctx, args) => { await ctx.db.patch(args.id, { deletedAt: undefined }); } });
export const restoreExpense = mutation({ args: { id: v.id("expenses") }, handler: async (ctx, args) => { await ctx.db.patch(args.id, { deletedAt: undefined }); } });
export const restoreDocument = mutation({ args: { id: v.id("documents") }, handler: async (ctx, args) => { await ctx.db.patch(args.id, { deletedAt: undefined }); } });

export const purgeClient = mutation({ args: { id: v.id("clients") }, handler: async (ctx, args) => { await ctx.db.delete(args.id); } });
export const purgeProject = mutation({ args: { id: v.id("projects") }, handler: async (ctx, args) => { await ctx.db.delete(args.id); } });
export const purgeQuote = mutation({ args: { id: v.id("quotes") }, handler: async (ctx, args) => { await ctx.db.delete(args.id); } });
export const purgeWorker = mutation({ args: { id: v.id("workers") }, handler: async (ctx, args) => { await ctx.db.delete(args.id); } });
export const purgeJob = mutation({ args: { id: v.id("workerJobs") }, handler: async (ctx, args) => { await ctx.db.delete(args.id); } });
export const purgeExpense = mutation({ args: { id: v.id("expenses") }, handler: async (ctx, args) => { await ctx.db.delete(args.id); } });
export const purgeDocument = mutation({ args: { id: v.id("documents") }, handler: async (ctx, args) => { await ctx.db.delete(args.id); } });

export const empty = mutation({
  args: {},
  handler: async (ctx) => {
    const tables = ["clients", "projects", "quotes", "workers", "workerJobs", "expenses", "documents"];
    for (const table of tables) {
      const deleted = await ctx.db.query(table as any).withIndex("by_deletedAt", (q) => q.gt("deletedAt", 0)).collect();
      for (const item of deleted) {
        await ctx.db.delete(item._id);
      }
    }
  }
});
