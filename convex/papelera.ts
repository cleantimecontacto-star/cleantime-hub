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

    try {
      // Usamos índices para buscar solo los elementos que tienen deletedAt definido
      // Esto es mucho más eficiente que escanear toda la tabla
      
      const clients = await ctx.db
        .query("clients")
        .withIndex("by_deletedAt", (q) => q.gt("deletedAt", 0))
        .collect();
      for (const c of clients) {
        if (c.deletedAt) {
          out.push({
            pid: `cliente:${c._id}`,
            tipo: "cliente",
            resumen: c.name || "(sin nombre)",
            fecha: c.deletedAt,
          });
        }
      }

      const projects = await ctx.db
        .query("projects")
        .withIndex("by_deletedAt", (q) => q.gt("deletedAt", 0))
        .collect();
      for (const p of projects) {
        if (p.deletedAt) {
          out.push({
            pid: `proyecto:${p._id}`,
            tipo: "proyecto",
            resumen: p.name || "(sin nombre)",
            fecha: p.deletedAt,
          });
        }
      }

      const quotes = await ctx.db
        .query("quotes")
        .withIndex("by_deletedAt", (q) => q.gt("deletedAt", 0))
        .collect();
      for (const q of quotes) {
        if (q.deletedAt) {
          out.push({
            pid: `cotizacion:${q._id}`,
            tipo: "cotizacion",
            resumen: `${q.number} — ${q.clientName}`,
            fecha: q.deletedAt,
          });
        }
      }

      const workers = await ctx.db
        .query("workers")
        .withIndex("by_deletedAt", (q) => q.gt("deletedAt", 0))
        .collect();
      for (const w of workers) {
        if (w.deletedAt) {
          out.push({
            pid: `trabajador:${w._id}`,
            tipo: "trabajador",
            resumen: w.name || "(sin nombre)",
            fecha: w.deletedAt,
          });
        }
      }

      const jobs = await ctx.db
        .query("workerJobs")
        .withIndex("by_deletedAt", (q) => q.gt("deletedAt", 0))
        .collect();
      for (const j of jobs) {
        if (j.deletedAt) {
          out.push({
            pid: `trabajo:${j._id}`,
            tipo: "trabajo",
            resumen: `${j.description} (${j.date})`,
            fecha: j.deletedAt,
          });
        }
      }

      const expenses = await ctx.db
        .query("expenses")
        .withIndex("by_deletedAt", (q) => q.gt("deletedAt", 0))
        .collect();
      for (const e of expenses) {
        if (e.deletedAt) {
          out.push({
            pid: `gasto:${e._id}`,
            tipo: "gasto",
            resumen: `${e.category} — ${e.description}`,
            fecha: e.deletedAt,
          });
        }
      }

      const docs = await ctx.db
        .query("documents")
        .withIndex("by_deletedAt", (q) => q.gt("deletedAt", 0))
        .collect();
      for (const d of docs) {
        if (d.deletedAt) {
          out.push({
            pid: `documento:${d._id}`,
            tipo: "documento",
            resumen: d.name || "(sin nombre)",
            fecha: d.deletedAt,
          });
        }
      }

      out.sort((a, b) => b.fecha - a.fecha);
    } catch (err) {
      console.error("Error en papelera.list:", err);
      // Retornar lo que se haya podido recolectar hasta el error
    }

    return out;
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
    // Hard cascade
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
        // file may already be gone
      }
      await ctx.db.delete(args.id);
    }
  },
});

/** Vacía la papelera: borra definitivamente todos los items con deletedAt. */
export const empty = mutation({
  args: {},
  handler: async (ctx) => {
    try {
      // Usar índices para encontrar elementos borrados y eliminarlos definitivamente
      const clients = await ctx.db
        .query("clients")
        .withIndex("by_deletedAt", (q) => q.gt("deletedAt", 0))
        .collect();
      for (const c of clients) {
        const projects = await ctx.db
          .query("projects")
          .withIndex("by_client", (q) => q.eq("clientId", c._id))
          .collect();
        for (const p of projects) {
          await ctx.db.delete(p._id);
        }
        await ctx.db.delete(c._id);
      }

      const projects = await ctx.db
        .query("projects")
        .withIndex("by_deletedAt", (q) => q.gt("deletedAt", 0))
        .collect();
      for (const p of projects) {
        await ctx.db.delete(p._id);
      }

      const quotes = await ctx.db
        .query("quotes")
        .withIndex("by_deletedAt", (q) => q.gt("deletedAt", 0))
        .collect();
      for (const q of quotes) {
        await ctx.db.delete(q._id);
      }

      const workers = await ctx.db
        .query("workers")
        .withIndex("by_deletedAt", (q) => q.gt("deletedAt", 0))
        .collect();
      for (const w of workers) {
        await ctx.db.delete(w._id);
      }

      const jobs = await ctx.db
        .query("workerJobs")
        .withIndex("by_deletedAt", (q) => q.gt("deletedAt", 0))
        .collect();
      for (const j of jobs) {
        await ctx.db.delete(j._id);
      }

      const expenses = await ctx.db
        .query("expenses")
        .withIndex("by_deletedAt", (q) => q.gt("deletedAt", 0))
        .collect();
      for (const e of expenses) {
        await ctx.db.delete(e._id);
      }

      const docs = await ctx.db
        .query("documents")
        .withIndex("by_deletedAt", (q) => q.gt("deletedAt", 0))
        .collect();
      for (const d of docs) {
        try {
          await ctx.storage.delete(d.storageId);
        } catch {
          // ignore
        }
        await ctx.db.delete(d._id);
      }
    } catch (err) {
      console.error("Error en papelera.empty:", err);
      throw err;
    }
  },
});
