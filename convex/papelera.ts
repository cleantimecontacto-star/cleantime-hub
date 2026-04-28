import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Papelera de reciclaje (Versión de Aislamiento Radical).
 * Solo consultamos 'clients' para verificar si el servidor responde.
 */

export const list = query({
  args: {},
  handler: async (ctx) => {
    const out: any[] = [];
    
    try {
      // SOLO PROBAMOS CON CLIENTES PARA VER SI CARGA
      const items = await ctx.db.query("clients").take(20);
      
      for (const item of items) {
        if ((item as any).deletedAt) {
          out.push({
            pid: `cliente:${item._id}`,
            tipo: "cliente",
            resumen: (item as any).name || "Sin nombre",
            fecha: (item as any).deletedAt,
          });
        }
      }
    } catch (e) {
      console.error("Error en aislamiento de clientes:", e);
    }

    return out;
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
export const empty = mutation({ args: {}, handler: async (ctx) => {} });
