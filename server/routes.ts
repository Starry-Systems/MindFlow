import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertMindmapSchema } from "@shared/schema";
import express from "express";

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static files from the static directory
  app.use(express.static('static'));

  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Mindmap routes
  app.get('/api/mindmaps', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const mindmaps = await storage.getMindmaps(userId);
      res.json(mindmaps);
    } catch (error) {
      console.error("Error fetching mindmaps:", error);
      res.status(500).json({ message: "Failed to fetch mindmaps" });
    }
  });

  app.get('/api/mindmaps/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const mindmap = await storage.getMindmap(req.params.id, userId);
      if (!mindmap) {
        return res.status(404).json({ message: "Mindmap not found" });
      }
      res.json(mindmap);
    } catch (error) {
      console.error("Error fetching mindmap:", error);
      res.status(500).json({ message: "Failed to fetch mindmap" });
    }
  });

  app.post('/api/mindmaps', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const mindmapData = insertMindmapSchema.parse({
        ...req.body,
        userId
      });
      const mindmap = await storage.createMindmap(mindmapData);
      res.status(201).json(mindmap);
    } catch (error) {
      console.error("Error creating mindmap:", error);
      res.status(500).json({ message: "Failed to create mindmap" });
    }
  });

  app.put('/api/mindmaps/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const mindmapData = insertMindmapSchema.partial().parse(req.body);
      const mindmap = await storage.updateMindmap(req.params.id, mindmapData, userId);
      if (!mindmap) {
        return res.status(404).json({ message: "Mindmap not found" });
      }
      res.json(mindmap);
    } catch (error) {
      console.error("Error updating mindmap:", error);
      res.status(500).json({ message: "Failed to update mindmap" });
    }
  });

  app.delete('/api/mindmaps/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deleted = await storage.deleteMindmap(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Mindmap not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting mindmap:", error);
      res.status(500).json({ message: "Failed to delete mindmap" });
    }
  });

  // Serve the main HTML file for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile('index.html', { root: './static' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
