import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, TableNames } from "./_generated/dataModel";

/**
 * Papelera de reciclaje - Gestión unificada para OPS y RRHH.
 * Esta versión utiliza 'filter' para máxima compatibilidad y 'try-catch' por tabla
 * para asegurar que un error en una tabla no bloquee toda la papelera.
 */

export const list = query({
  args: {},
  handler: async (ctx) => {
    // Definimos las tablas que tienen el campo 'deletedAt' según el schema.ts
    const tables: TableNames[] = [
      "clients",
      "projects",
      "quotes",
      "workers",
      "workerJobs",
      "expenses",
      "expenseCategories",
      "serviceTypes",
      "docCategories",
      "documents"
    ];

    const allDeletedItems: any[] = [];

    for (const table of tables) {
      try {
        // Consultamos la tabla filtrando por elementos que tengan deletedAt > 0
        const items = await ctx.db
          .query(table)
          .filter((q) => q.gt(q.field("deletedAt"), 0))
          .collect();

        if (items && items.length > 0) {
          // Mapeamos para incluir el tipo de tabla y asegurar consistencia
          allDeletedItems.push(
            ...items.map((item) => ({
              ...item,
              type: table, // El frontend usa esto para saber qué icono mostrar o qué mutación llamar
            }))
          );
        }
      } catch (error) {
        // Logueamos el error pero permitimos que la papelera siga cargando otras tablas
        console.error(`Error cargando papelera para tabla [${table}]:`, error);
      }
    }

    // Retornamos la lista ordenada por fecha de eliminación (más reciente arriba)
    return allDeletedItems.sort((a, b) => (Number(b.deletedAt) || 0) - (Number(a.deletedAt) || 0));
  },
});

// Alias para asegurar compatibilidad con cualquier versión del frontend
export const getDeletedItems = list;

// --- MUTACIONES DE RESTAURACIÓN ---
// Estas mutaciones simplemente eliminan el campo 'deletedAt' (lo ponen en undefined)

export const restoreClient = mutation({ args: { id: v.id("clients") }, handler: async (ctx, { id }) => { await ctx.db.patch(id, { deletedAt: undefined }); } });
export const restoreProject = mutation({ args: { id: v.id("projects") }, handler: async (ctx, { id }) => { await ctx.db.patch(id, { deletedAt: undefined }); } });
export const restoreQuote = mutation({ args: { id: v.id("quotes") }, handler: async (ctx, { id }) => { await ctx.db.patch(id, { deletedAt: undefined }); } });
export const restoreWorker = mutation({ args: { id: v.id("workers") }, handler: async (ctx, { id }) => { await ctx.db.patch(id, { deletedAt: undefined }); } });
export const restoreJob = mutation({ args: { id: v.id("workerJobs") }, handler: async (ctx, { id }) => { await ctx.db.patch(id, { deletedAt: undefined }); } });
export const restoreExpense = mutation({ args: { id: v.id("expenses") }, handler: async (ctx, { id }) => { await ctx.db.patch(id, { deletedAt: undefined }); } });
export const restoreDocument = mutation({ args: { id: v.id("documents") }, handler: async (ctx, { id }) => { await ctx.db.patch(id, { deletedAt: undefined }); } });

// --- MUTACIONES DE ELIMINACIÓN PERMANENTE (PURGE) ---

export const purgeClient = mutation({ args: { id: v.id("clients") }, handler: async (ctx, { id }) => { await ctx.db.delete(id); } });
export const purgeProject = mutation({ args: { id: v.id("projects") }, handler: async (ctx, { id }) => { await ctx.db.delete(id); } });
export const purgeQuote = mutation({ args: { id: v.id("quotes") }, handler: async (ctx, { id }) => { await ctx.db.delete(id); } });
export const purgeWorker = mutation({ args: { id: v.id("workers") }, handler: async (ctx, { id }) => { await ctx.db.delete(id); } });
export const purgeJob = mutation({ args: { id: v.id("workerJobs") }, handler: async (ctx, { id }) => { await ctx.db.delete(id); } });
export const purgeExpense = mutation({ args: { id: v.id("expenses") }, handler: async (ctx, { id }) => { await ctx.db.delete(id); } });
export const purgeDocument = mutation({ args: { id: v.id("documents") }, handler: async (ctx, { id }) => { await ctx.db.delete(id); } });

// --- VACIAR PAPELERA ---

export const empty = mutation({
  args: {},
  handler: async (ctx) => {
    const tables: TableNames[] = ["clients", "projects", "quotes", "workers", "workerJobs", "expenses", "documents"];
    for (const table of tables) {
      try {
        const deleted = await ctx.db.query(table).filter((q) => q.gt(q.field("deletedAt"), 0)).collect();
        for (const item of deleted) {
          await ctx.db.delete(item._id);
        }
      } catch (e) {
        console.error(`Error al vaciar papelera de la tabla ${table}:`, e);
      }
    }
  }
});
