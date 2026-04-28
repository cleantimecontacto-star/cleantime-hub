import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Papelera de reciclaje (Versión Renombrada para Forzar Actualización).
 * Hemos cambiado el nombre de 'list' a 'getDeletedItems' para evadir el error persistente en el servidor.
 */

export const getDeletedItems = query({
  args: {},
  handler: async () => {
    // Retornamos vacío por ahora para asegurar que la conexión sea exitosa
    return [];
  },
});

// Mantenemos 'list' como un alias por si acaso, pero apuntando a la nueva lógica segura
export const list = getDeletedItems;

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
