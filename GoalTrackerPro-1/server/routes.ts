import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertHabitSchema, insertFinanceSchema, insertGoalSchema, insertGoalProgressSchema } from "@shared/schema";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Habits Routes
  app.get("/api/habits", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const habits = await storage.getHabits(req.user.id);
    res.json(habits);
  });

  app.post("/api/habits", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const parsed = insertHabitSchema.parse(req.body);
    const habit = await storage.createHabit(req.user.id, parsed);
    res.json(habit);
  });

  app.patch("/api/habits/:id/toggle", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const habit = await storage.toggleHabit(
      parseInt(req.params.id), 
      req.user.id,
      req.body.reflection
    );
    res.json(habit);
  });

  // Goals Routes
  app.get("/api/goals", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const goals = await storage.getGoals(req.user.id);
    res.json(goals);
  });

  app.post("/api/goals", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const parsed = insertGoalSchema.parse(req.body);
    const goal = await storage.createGoal(req.user.id, parsed);
    res.json(goal);
  });

  app.get("/api/goals/:id/progress", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const progress = await storage.getGoalProgress(parseInt(req.params.id), req.user.id);
    res.json(progress);
  });

  app.post("/api/goals/:id/progress", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const parsed = insertGoalProgressSchema.parse({
      ...req.body,
      goalId: parseInt(req.params.id),
    });
    const progress = await storage.updateGoalProgress(req.user.id, parsed);
    res.json(progress);
  });

  // Rewards Routes
  app.get("/api/rewards", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const rewards = await storage.getHabitRewards(req.user.id);
    res.json(rewards);
  });

  app.post("/api/rewards/:id/claim", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const reward = await storage.claimReward(parseInt(req.params.id), req.user.id);
    res.json(reward);
  });

  // Finance Routes
  app.get("/api/finances", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const finances = await storage.getFinances(req.user.id);
    res.json(finances);
  });

  app.post("/api/finances", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const parsed = insertFinanceSchema.parse(req.body);
    const finance = await storage.createFinance(req.user.id, parsed);
    res.json(finance);
  });

  const httpServer = createServer(app);
  return httpServer;
}