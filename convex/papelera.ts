import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Papelera de reciclaje (soft-delete).
 * Lista todos los elementos marcados con deletedAt, agrupados por tipo.
 * Permite restaurar (limpiar deletedAt) o eliminar definitivamente.
 */

export type PapeleraTipo =
  | "cliente"
  | "proyecto"
  | "cotizacion"
  | "trabajador"
  | "trabajo"
  | "gasto"
  | "documento";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const out: Array<{
      pid: string;
      tipo: PapeleraTipo;
      resumen: string;
      fecha: number;
    }> = [];

    // Definimos las tablas y cómo obtener su resumen
    const tables: Array<{ name: any; tipo: PapeleraTipo; getResumen: (doc: any) => string }> = [
      { name: "clients", tipo: "cliente", getResumen: (doc) => doc.name || "(sin nombre)" },
      { name: "projects", tipo: "proyecto", getResumen: (doc) => doc.name || "(sin nombre)" },
      { name: "quotes", tipo: "cotizacion", getResumen: (doc) => `${doc.number} — ${doc.clientName}` },
      { name: "workers", tipo: "trabajador", getResumen: (doc) => doc.name || "(sin nombre)" },
      { name: "workerJobs", tipo: "trabajo", getResumen: (doc) => `${doc.description} (${doc.date})` },
      { name: "expenses", tipo: "gasto", getResumen: (doc) => `${doc.category} — ${doc.description}` },
      { name: "documents", tipo: "documento", getResumen: (doc) => doc.name || "(sin nombre)" },
    ];

    // Procesamos cada tabla de forma independiente y con captura de errores individual
    for (const table of tables) {
      try {
        const items = await ctx.db
          .query(table.name)
          .withIndex("by_deletedAt", (q) => q.gt("deletedAt", 0))
          .collect();

        for (const item of items) {
          if (item.deletedAt) {
            out.push({
              pid: `${table.tipo}:${item._id}`,
              tipo: table.tipo,
              resumen: table.getResumen(item),
              fecha: item.deletedAt,
            });
          }
        }
      } catch (err) {
        // Si una tabla falla (por ejemplo, por no tener índice aún o ser muy grande),
        // registramos el error pero permitimos que las demás sigan funcionando.
        console.error(`Error consultando tabla ${table.name} en papelera:`, err);
      }
    }

    // Ordenar por fecha de eliminación (más reciente primero)
    return out.sort((a, b) => b.fecha - a.fecha);
  },
});

export const restoreClient = mutation({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { deletedAt: undefined });
  },
});

export const restoreProject = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { deletedAt: undefined });
  },
});

export const restoreQuote = mutation({
  args: { id: v.id("quotes") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { deletedAt: undefined });
  },
});

export const restoreWorker = mutation({
  args: { id: v.id("workers") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { deletedAt: undefined });
  },
});

export const restoreJob = mutation({
  args: { id: v.id("workerJobs") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { deletedAt: undefined });
  },
});

export const restoreExpense = mutation({
  args: { id: v.id("expenses") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { deletedAt: undefined });
  },
});

export const restoreDocument = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { deletedAt: undefined });
  },
});

export const purgeClient = mutation({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    // Hard cascade: Borrado definitivo de proyectos, cotizaciones, trabajos y gastos asociados
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_client", (q) => q.eq("clientId", args.id))
      .collect();
    for (const p of projects) await ctx.db.delete(p._id);

    const quotes = await ctx.db
      .query("quotes")
      .filter((q) => q.eq(q.field("clientId"), args.id))
      .collect();
    
    for (const quote of quotes) {
      const jobs = await ctx.db
        .query("workerJobs")
        .withIndex("by_quote", (q) => q.eq("quoteId", quote._id))
        .collect();
      for (const j of jobs) await ctx.db.delete(j._id);

      const exps = await ctx.db
        .query("expenses")
        .withIndex("by_quote", (q) => q.eq("quoteId", quote._id))
        .collect();
      for (const e of exps) await ctx.db.delete(e._id);

      await ctx.db.delete(quote._id);
    }
    await ctx.db.delete(args.id);
  },
});

export const purgeProject = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const purgeQuote = mutation({
  args: { id: v.id("quotes") },
  handler: async (ctx, args) => {
    const jobs = await ctx.db
      .query("workerJobs")
      .withIndex("by_quote", (q) => q.eq("quoteId", args.id))
      .collect();
    for (const j of jobs) await ctx.db.delete(j._id);

    const exps = await ctx.db
      .query("expenses")
      .withIndex("by_quote", (q) => q.eq("quoteId", args.id))
      .collect();
    for (const e of exps) await ctx.db.delete(e._id);

    await ctx.db.delete(args.id);
  },
});

export const purgeWorker = mutation({
  args: { id: v.id("workers") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const purgeJob = mutation({
  args: { id: v.id("workerJobs") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const purgeExpense = mutation({
  args: { id: v.id("expenses") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const purgeDocument = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (doc) {
      try {
        await ctx.storage.delete(doc.storageId);
      } catch {
        // ignorar si el archivo ya no existe
      }
      await ctx.db.delete(args.id);
    }
  },
});

/** Vacía la papelera: borra definitivamente todos los items con deletedAt. */
export const empty = mutation({
  args: {},
  handler: async (ctx) => {
    const tables = ["clients", "projects", "quotes", "workers", "workerJobs", "expenses", "documents"];
    
    for (const tableName of tables) {
      try {
        const items = await ctx.db
          .query(tableName as any)
          .withIndex("by_deletedAt", (q) => q.gt("deletedAt", 0))
          .collect();

        for (const item of items) {
          if (tableName === "documents") {
            try {
              await ctx.storage.delete((item as any).storageId);
            } catch {}
          }
          await ctx.db.delete(item._id);
        }
      } catch (err) {
        console.error(`Error vaciando tabla ${tableName} en papelera:`, err);
      }
    }
  },
});
