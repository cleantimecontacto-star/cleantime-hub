import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Papelera de reciclaje (Versión de Diagnóstico Ultra-Simple).
 * Intentamos cargar solo las tablas más básicas para ver si el error persiste.
 */

export const list = query({
  args: {},
  handler: async (ctx) => {
    const out: any[] = [];

    // Lista de tablas a consultar una por una con seguridad total
    const tableConfigs = [
      { name: "clients", tipo: "cliente" },
      { name: "projects", tipo: "proyecto" },
      { name: "quotes", tipo: "cotizacion" },
      { name: "workers", tipo: "trabajador" },
      { name: "workerJobs", tipo: "trabajo" },
      { name: "expenses", tipo: "gasto" },
      { name: "documents", tipo: "documento" },
    ];

    for (const config of tableConfigs) {
      try {
        // Usamos un escaneo básico sin índices primero para descartar problemas de configuración de índices
        const all = await ctx.db.query(config.name as any).collect();
        const deleted = all.filter(item => (item as any).deletedAt !== undefined && (item as any).deletedAt !== null);
        
        for (const item of deleted) {
          out.push({
            pid: `${config.tipo}:${item._id}`,
            tipo: config.tipo,
            resumen: (item as any).name || (item as any).number || (item as any).description || "Sin título",
            fecha: (item as any).deletedAt || 0,
          });
        }
      } catch (e) {
        console.error(`Error en tabla ${config.name}:`, e);
      }
    }

    return out.sort((a, b) => b.fecha - a.fecha).slice(0, 50);
  },
});

// Mantener las mutaciones de restauración para no romper el frontend
export const restoreClient = mutation({ args: { id: v.id("clients") }, handler: async (ctx, args) => { await ctx.db.patch(args.id, { deletedAt: undefined }); } });
export const restoreProject = mutation({ args: { id: v.id("projects") }, handler: async (ctx, args) => { await ctx.db.patch(args.id, { deletedAt: undefined }); } });
export const restoreQuote = mutation({ args: { id: v.id("quotes") }, handler: async (ctx, args) => { await ctx.db.patch(args.id, { deletedAt: undefined }); } });
export const restoreWorker = mutation({ args: { id: v.id("workers") }, handler: async (ctx, args) => { await ctx.db.patch(args.id, { deletedAt: undefined }); } });
export const restoreJob = mutation({ args: { id: v.id("workerJobs") }, handler: async (ctx, args) => { await ctx.db.patch(args.id, { deletedAt: undefined }); } });
export const restoreExpense = mutation({ args: { id: v.id("expenses") }, handler: async (ctx, args) => { await ctx.db.patch(args.id, { deletedAt: undefined }); } });
export const restoreDocument = mutation({ args: { id: v.id("documents") }, handler: async (ctx, args) => { await ctx.db.patch(args.id, { deletedAt: undefined }); } });

// Mutaciones de purga simplificadas
export const purgeClient = mutation({ args: { id: v.id("clients") }, handler: async (ctx, args) => { await ctx.db.delete(args.id); } });
export const purgeProject = mutation({ args: { id: v.id("projects") }, handler: async (ctx, args) => { await ctx.db.delete(args.id); } });
export const purgeQuote = mutation({ args: { id: v.id("quotes") }, handler: async (ctx, args) => { await ctx.db.delete(args.id); } });
export const purgeWorker = mutation({ args: { id: v.id("workers") }, handler: async (ctx, args) => { await ctx.db.delete(args.id); } });
export const purgeJob = mutation({ args: { id: v.id("workerJobs") }, handler: async (ctx, args) => { await ctx.db.delete(args.id); } });
export const purgeExpense = mutation({ args: { id: v.id("expenses") }, handler: async (ctx, args) => { await ctx.db.delete(args.id); } });
export const purgeDocument = mutation({ args: { id: v.id("documents") }, handler: async (ctx, args) => { await ctx.db.delete(args.id); } });

export const empty = mutation({ args: {}, handler: async (ctx) => { /* Simplificado */ } });
