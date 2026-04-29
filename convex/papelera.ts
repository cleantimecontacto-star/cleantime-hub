import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { TableNames } from "./_generated/dataModel";

/**
 * Papelera de reciclaje - Gestión unificada para OPS y RRHH.
 *
 * Implementación a prueba de fallos:
 *  - Hace un .collect() simple por tabla y filtra en JS (evita errores
 *    de Convex al comparar campos `deletedAt` ausentes con `q.gt`).
 *  - Cada tabla está envuelta en try/catch, así un fallo en una sola
 *    tabla no rompe toda la papelera.
 *  - Nunca lanza un error al cliente; en el peor caso devuelve [].
 */

const TABLES_WITH_DELETED_AT: TableNames[] = [
  "clients",
  "projects",
  "quotes",
  "workers",
  "workerJobs",
  "expenses",
  "expenseCategories",
  "serviceTypes",
  "docCategories",
  "documents",
];

function tipoFromTable(table: string): string {
  switch (table) {
    case "workerJobs":
      return "trabajo";
    case "quotes":
      return "cotizacion";
    case "clients":
      return "cliente";
    case "projects":
      return "proyecto";
    case "workers":
      return "trabajador";
    case "expenses":
      return "gasto";
    case "expenseCategories":
      return "categoria_gasto";
    case "serviceTypes":
      return "tipo_servicio";
    case "docCategories":
      return "categoria_documento";
    case "documents":
      return "documento";
    default:
      return table;
  }
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const allDeletedItems: any[] = [];

    for (const table of TABLES_WITH_DELETED_AT) {
      try {
        // Traemos TODA la tabla y filtramos en JS. Esto evita
        // cualquier rareza con índices o con `q.gt` sobre campos opcionales.
        const all = await ctx.db.query(table).collect();

        const deleted = all.filter((item: any) => {
          const d = item?.deletedAt;
          return typeof d === "number" && d > 0;
        });

        if (deleted.length > 0) {
          allDeletedItems.push(
            ...deleted.map((item: any) => ({
              ...item,
              pid: `${table}:${item._id}`,
              tipo: tipoFromTable(table),
              resumen:
                item.name ||
                item.number ||
                item.description ||
                item.category ||
                "Elemento sin nombre",
              fecha: item.deletedAt,
              type: table,
            }))
          );
        }
      } catch (error) {
        // Nunca propagamos: la papelera debe seguir funcionando
        console.error(`[papelera] Error leyendo tabla [${table}]:`, error);
      }
    }

    try {
      allDeletedItems.sort(
        (a, b) => (Number(b.deletedAt) || 0) - (Number(a.deletedAt) || 0)
      );
    } catch (e) {
      console.error("[papelera] Error ordenando resultados:", e);
    }

    return allDeletedItems;
  },
});

// Alias para compatibilidad con el frontend (api.papelera.getDeletedItems)
export const getDeletedItems = list;

// --- MUTACIONES DE RESTAURACIÓN ---

export const restoreClient = mutation({
  args: { id: v.id("clients") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { deletedAt: undefined });
  },
});
export const restoreProject = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { deletedAt: undefined });
  },
});
export const restoreQuote = mutation({
  args: { id: v.id("quotes") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { deletedAt: undefined });
  },
});
export const restoreWorker = mutation({
  args: { id: v.id("workers") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { deletedAt: undefined });
  },
});
export const restoreJob = mutation({
  args: { id: v.id("workerJobs") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { deletedAt: undefined });
  },
});
export const restoreExpense = mutation({
  args: { id: v.id("expenses") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { deletedAt: undefined });
  },
});
export const restoreDocument = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { deletedAt: undefined });
  },
});

// --- MUTACIONES DE ELIMINACIÓN PERMANENTE (PURGE) ---

export const purgeClient = mutation({
  args: { id: v.id("clients") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
export const purgeProject = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
export const purgeQuote = mutation({
  args: { id: v.id("quotes") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
export const purgeWorker = mutation({
  args: { id: v.id("workers") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
export const purgeJob = mutation({
  args: { id: v.id("workerJobs") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
export const purgeExpense = mutation({
  args: { id: v.id("expenses") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
export const purgeDocument = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

// --- VACIAR PAPELERA ---

export const empty = mutation({
  args: {},
  handler: async (ctx) => {
    for (const table of TABLES_WITH_DELETED_AT) {
      try {
        const all = await ctx.db.query(table).collect();
        const deleted = all.filter((item: any) => {
          const d = item?.deletedAt;
          return typeof d === "number" && d > 0;
        });
        for (const item of deleted) {
          try {
            await ctx.db.delete(item._id);
          } catch (innerErr) {
            console.error(
              `[papelera] Error borrando item ${item._id} en ${table}:`,
              innerErr
            );
          }
        }
      } catch (e) {
        console.error(`[papelera] Error vaciando tabla ${table}:`, e);
      }
    }
  },
});
