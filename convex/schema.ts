import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  }).index("by_token", ["tokenIdentifier"]),

  // App configuration
  config: defineTable({
    key: v.string(),
    value: v.string(),
    storageId: v.optional(v.id("_storage")),
  }).index("by_key", ["key"]),

  // Clients
  clients: defineTable({
    name: v.string(),
    rut: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    archived: v.optional(v.boolean()),
  }),

  // Projects (linked to a client)
  projects: defineTable({
    clientId: v.id("clients"),
    name: v.string(),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
  }).index("by_client", ["clientId"]),

  // Quotes/Cotizaciones
  quotes: defineTable({
    number: v.string(),
    clientId: v.id("clients"),
    clientName: v.string(),
    projectId: v.optional(v.id("projects")),
    projectName: v.optional(v.string()),
    projectAddress: v.optional(v.string()),
    serviceType: v.string(),
    description: v.optional(v.string()),
    squareMeters: v.number(),
    pricePerM2: v.number(),
    subtotal: v.number(),
    iva: v.number(),
    total: v.number(),
    includesSupplies: v.boolean(),
    excessiveDirt: v.boolean(),
    suppliesPct: v.optional(v.number()),
    excessiveDirtPct: v.optional(v.number()),
    notes: v.optional(v.string()),
    status: v.union(
      v.literal("Pendiente"),
      v.literal("Aprobada"),
      v.literal("Rechazada"),
      v.literal("Facturada")
    ),
    date: v.string(),
    terms: v.optional(v.string()),
    unit: v.optional(v.string()),
    otNumber: v.optional(v.string()),
    invoiceNumber: v.optional(v.string()),
    paymentStatus: v.optional(v.string()),
  }).index("by_status", ["status"]).index("by_date", ["date"]),

  // Workers/Trabajadores
  workers: defineTable({
    name: v.string(),
    phone: v.optional(v.string()),
    paymentType: v.union(
      v.literal("por_dia"),
      v.literal("a_trato"),
      v.literal("por_m2")
    ),
    rateAmount: v.number(),
  }),

  // Worker jobs
  workerJobs: defineTable({
    workerId: v.id("workers"),
    quoteId: v.optional(v.id("quotes")),
    description: v.string(),
    amount: v.number(),
    paid: v.boolean(),
    date: v.string(),
  }).index("by_worker", ["workerId"]).index("by_quote", ["quoteId"]),

  // Expenses/Gastos
  expenses: defineTable({
    category: v.string(),
    description: v.string(),
    amount: v.number(),
    date: v.string(),
    quoteId: v.optional(v.id("quotes")),
    quoteName: v.optional(v.string()),
  }).index("by_category", ["category"]).index("by_quote", ["quoteId"]),

  // Expense categories (editable)
  expenseCategories: defineTable({
    name: v.string(),
    order: v.number(),
  }),

  // Service types (editable)
  serviceTypes: defineTable({
    name: v.string(),
    pricePerM2: v.optional(v.number()),
    order: v.number(),
  }).index("by_order", ["order"]),

  // ── Documentos de empresa ──────────────────────────────────────────────────

  // Document categories (editable)
  docCategories: defineTable({
    name: v.string(),
    order: v.number(),
  }).index("by_order", ["order"]),

  // Company documents
  documents: defineTable({
    name: v.string(),
    categoryId: v.id("docCategories"),
    storageId: v.id("_storage"),
    fileType: v.string(),
    fileSize: v.number(),
    uploadedAt: v.string(),
  }).index("by_category", ["categoryId"]),
});
