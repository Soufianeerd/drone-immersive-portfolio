import { boolean, date, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Base de données du site (Neon / Postgres).
 * Pensée comme un modèle réutilisable : rien n'est propre à Anass, tout se règle depuis l'admin.
 */

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull().default(""),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Réglages du site : une seule ligne (id = 1), contenu JSON typé dans src/lib/cms/types.ts. */
export const settings = pgTable("settings", {
  id: integer("id").primaryKey(),
  data: jsonb("data").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  position: integer("position").notNull().default(0),
  visible: boolean("visible").notNull().default(true),
});

/** Une collection = un projet, un événement, une série photo ou vidéo. */
export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  kind: text("kind").notNull().default("photo"), // photo | video | evenement
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
  description: text("description").notNull().default(""),
  location: text("location").notNull().default(""),
  eventDate: date("event_date"),
  clientName: text("client_name").notNull().default(""),
  format: text("format").notNull().default("landscape"), // wide | landscape | portrait | tall | square
  coverMediaId: integer("cover_media_id"),
  featured: boolean("featured").notNull().default(false),
  published: boolean("published").notNull().default(false),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  collectionId: integer("collection_id").references(() => collections.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(), // image | video
  url: text("url").notNull(),
  posterUrl: text("poster_url"),
  caption: text("caption").notNull().default(""),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  company: text("company").notNull().default(""),
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  address: text("address").notNull().default(""),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type QuoteLine = { label: string; qty: number; price: number };

export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  number: text("number").notNull().unique(),
  clientId: integer("client_id").references(() => clients.id, { onDelete: "set null" }),
  title: text("title").notNull().default(""),
  status: text("status").notNull().default("brouillon"), // brouillon | envoye | accepte | refuse
  lines: jsonb("lines").$type<QuoteLine[]>().notNull().default([]),
  notes: text("notes").notNull().default(""),
  eventDate: date("event_date"),
  validUntil: date("valid_until"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Demandes reçues par le formulaire de contact du site. */
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  type: text("type").notNull().default(""),
  body: text("body").notNull(),
  read: boolean("read").notNull().default(false),
  clientId: integer("client_id").references(() => clients.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
