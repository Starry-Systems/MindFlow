import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  uuid,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Mindmap documents
export const mindmaps = pgTable("mindmaps", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  userId: varchar("user_id").notNull().references(() => users.id),
  data: jsonb("data").notNull(), // Contains nodes, connections, canvas settings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const insertMindmapSchema = createInsertSchema(mindmaps).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMindmap = z.infer<typeof insertMindmapSchema>;
export type Mindmap = typeof mindmaps.$inferSelect;
