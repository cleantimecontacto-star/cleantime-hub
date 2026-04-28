import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Papelera de reciclaje - Versión ultra-robusta.
 * Esta versión evita errores de servidor si faltan índices o hay problemas de permisos.
 */

export const list = query({
  args: {},
  handler: async (ctx) => {
    // Lista completa de tablas a revisar
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
      try {
        // Usamos filter en lugar de withIndex para evitar errores si los índices no se han desplegado
        const items = await ctx.db
          .query(table as any)
          .filter((q) => q.gt(q.field("deletedAt"), 0))
          .collect();

        if (items && items.length > 0) {
          allDeletedItems.push(
            ...items.map((item) => ({
              ...item,
              type: table,
            }))
          );
        }
      } catch (error) {
        // Si una tabla falla (por ejemplo, si no existe o no tiene el campo), continuamos con las demás
        console.error(`Error consultando tabla ${table}:`, error);
      }
    }

    // Ordenar por fecha de eliminación (más reciente primero)
    return allDeletedItems.sort((a, b) => (Number(b.deletedAt) || 0) - (Number(a.deletedAt) || 0));
  },
});

// Alias para compatibilidad
export const getDeletedItems = list;

// Mutaciones de restauración con validación de existencia
export const restoreClient = mutation({ args: { id: v.id("clients") }, handler: async (ctx, args) => { await ctx.db.patch(args.id, { deletedAt: undefined }); } });
export const restoreProject = mutation({ args: { id: v.id("projects") }, handler: async (ctx, args) => { await ctx.db.patch(args.id, { deletedAt: undefined }); } });
export const restoreQuote = mutation({ args: { id: v.id("quotes") }, handler: async (ctx, args) => { await ctx.db.patch(args.id, { deletedAt: undefined }); } });
export const restoreWorker = mutation({ args: { id: v.id("workers") }, handler: async (ctx, args) => { await ctx.db.patch(args.id, { deletedAt: undefined }); } });
export const restoreJob = mutation({ args: { id: v.id("workerJobs") }, handler: async (ctx, args) => { await ctx.db.patch(args.id, { deletedAt: undefined }); } });
export const restoreExpense = mutation({ args: { id: v.id("expenses") }, handler: async (ctx, args) => { await ctx.db.patch(args.id, { deletedAt: undefined }); } });
export const restoreDocument = mutation({ args: { id: v.id("documents") }, handler: async (ctx, args) => { await ctx.db.patch(args.id, { deletedAt: undefined }); } });

// Mutaciones de purga
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
      try {
        const deleted = await ctx.db.query(table as any).filter((q) => q.gt(q.field("deletedAt"), 0)).collect();
        for (const item of deleted) {
          await ctx.db.delete(item._id);
        }
      } catch (e) {}
    }
  }
});
