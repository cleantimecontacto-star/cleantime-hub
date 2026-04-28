import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Papelera de reciclaje (Modo de Emergencia - Consultas Desactivadas).
 * Devolvemos una lista vacía para evitar que el Server Error bloquee la aplicación.
 */

export const list = query({
  args: {},
  handler: async () => {
    // Retornamos vacío inmediatamente para que la página cargue sin errores
    return [];
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
