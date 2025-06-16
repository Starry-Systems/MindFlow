import {
  users,
  mindmaps,
  type User,
  type UpsertUser,
  type Mindmap,
  type InsertMindmap,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Mindmap operations
  getMindmaps(userId: string): Promise<Mindmap[]>;
  getMindmap(id: string, userId: string): Promise<Mindmap | undefined>;
  createMindmap(mindmap: InsertMindmap): Promise<Mindmap>;
  updateMindmap(id: string, mindmap: Partial<InsertMindmap>, userId: string): Promise<Mindmap | undefined>;
  deleteMindmap(id: string, userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Mindmap operations
  async getMindmaps(userId: string): Promise<Mindmap[]> {
    return await db
      .select()
      .from(mindmaps)
      .where(eq(mindmaps.userId, userId))
      .orderBy(mindmaps.updatedAt);
  }

  async getMindmap(id: string, userId: string): Promise<Mindmap | undefined> {
    const [mindmap] = await db
      .select()
      .from(mindmaps)
      .where(eq(mindmaps.id, id) && eq(mindmaps.userId, userId));
    return mindmap;
  }

  async createMindmap(mindmapData: InsertMindmap): Promise<Mindmap> {
    const [mindmap] = await db
      .insert(mindmaps)
      .values(mindmapData)
      .returning();
    return mindmap;
  }

  async updateMindmap(id: string, mindmapData: Partial<InsertMindmap>, userId: string): Promise<Mindmap | undefined> {
    const [mindmap] = await db
      .update(mindmaps)
      .set({ ...mindmapData, updatedAt: new Date() })
      .where(eq(mindmaps.id, id) && eq(mindmaps.userId, userId))
      .returning();
    return mindmap;
  }

  async deleteMindmap(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(mindmaps)
      .where(eq(mindmaps.id, id) && eq(mindmaps.userId, userId));
    return (result.rowCount || 0) > 0;
  }
}

export const storage = new DatabaseStorage();
