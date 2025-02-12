import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
});

export const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  targetFrequency: integer("target_frequency").notNull(),
  currentStreak: integer("current_streak").default(0),
  completed: boolean("completed").default(false),
  lastCompletedAt: timestamp("last_completed_at"),
  missedReason: text("missed_reason"),
  longestStreak: integer("longest_streak").default(0),
  totalCompletions: integer("total_completions").default(0),
});

export const habitRewards = pgTable("habit_rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  habitId: integer("habit_id").notNull(),
  rewardTitle: text("reward_title").notNull(),
  description: text("description").notNull(),
  streakRequired: integer("streak_required").notNull(),
  claimed: boolean("claimed").default(false),
  claimedAt: timestamp("claimed_at"),
});

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'financial', 'skill', etc.
  targetAmount: decimal("target_amount"), // For financial goals
  currentAmount: decimal("current_amount").default("0"),
  targetDate: timestamp("target_date"),
  dailyTargetHours: decimal("daily_target_hours"), // For skill goals
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const goalProgress = pgTable("goal_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  goalId: integer("goal_id").notNull(),
  amount: decimal("amount"), // Money saved or hours spent
  date: timestamp("date").notNull(),
  notes: text("notes"),
});

export const finances = pgTable("finances", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  description: text("description").notNull(),
  amount: integer("amount").notNull(),
  type: text("type").notNull(), // income, expense, or investment
  category: text("category").notNull(),
  investmentType: text("investment_type"), // stocks, bonds, crypto, etc.
  date: timestamp("date").notNull(),
  savingsAllocation: integer("savings_allocation").default(0), // Percentage allocated to savings
});

export const insertUserSchema = createInsertSchema(users)
  .extend({
    email: z.string().email("Please enter a valid email address"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  });

export const insertHabitSchema = createInsertSchema(habits)
  .omit({ id: true, userId: true, currentStreak: true, completed: true, lastCompletedAt: true, longestStreak: true, totalCompletions: true });

export const insertGoalSchema = createInsertSchema(goals)
  .omit({ id: true, userId: true, currentAmount: true, completed: true, createdAt: true });

export const insertGoalProgressSchema = createInsertSchema(goalProgress)
  .omit({ id: true, userId: true });

export const insertFinanceSchema = createInsertSchema(finances)
  .omit({ id: true, userId: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertHabit = z.infer<typeof insertHabitSchema>;
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type InsertGoalProgress = z.infer<typeof insertGoalProgressSchema>;
export type InsertFinance = z.infer<typeof insertFinanceSchema>;

export type User = typeof users.$inferSelect;
export type Habit = typeof habits.$inferSelect;
export type Finance = typeof finances.$inferSelect;
export type HabitReward = typeof habitRewards.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type GoalProgress = typeof goalProgress.$inferSelect;

// Predefined rewards for different streak milestones
export const STREAK_REWARDS = [
  {
    streakRequired: 7,
    rewards: [
      "Treat yourself to your favorite coffee ☕",
      "Watch an episode of your favorite show 📺",
      "Take a relaxing 15-minute break 🌿",
    ]
  },
  {
    streakRequired: 14,
    rewards: [
      "Order your favorite takeout meal 🍕",
      "Buy yourself a small gift 🎁",
      "Take a long relaxing bath 🛁",
    ]
  },
  {
    streakRequired: 30,
    rewards: [
      "Book a massage session 💆‍♂️",
      "Buy that item you've been eyeing 🛍️",
      "Take a day trip somewhere new 🚗",
    ]
  }
];

// Investment categories
export const INVESTMENT_TYPES = [
  "Stocks",
  "Bonds",
  "Mutual Funds",
  "Real Estate",
  "Cryptocurrency",
  "Fixed Deposits",
  "Gold",
  "Other"
] as const;

// Goal types
export const GOAL_TYPES = [
  "Financial",
  "Skill Development",
  "Education",
  "Travel",
  "Health",
  "Career",
  "Other"
] as const;