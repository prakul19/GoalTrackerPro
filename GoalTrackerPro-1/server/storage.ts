import { IStorage } from "./storage";
import { 
  User, InsertUser, Habit, InsertHabit, Finance, InsertFinance, 
  HabitReward, STREAK_REWARDS, Goal, InsertGoal, GoalProgress, InsertGoalProgress 
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
import { startOfDay, isSameDay } from "date-fns";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;

  getHabits(userId: number): Promise<Habit[]>;
  createHabit(userId: number, habit: InsertHabit): Promise<Habit>;
  toggleHabit(id: number, userId: number, reflection?: string): Promise<Habit>;
  getHabitRewards(userId: number): Promise<HabitReward[]>;
  claimReward(rewardId: number, userId: number): Promise<HabitReward>;

  getGoals(userId: number): Promise<Goal[]>;
  createGoal(userId: number, goal: InsertGoal): Promise<Goal>;
  updateGoalProgress(userId: number, progress: InsertGoalProgress): Promise<GoalProgress>;
  getGoalProgress(goalId: number, userId: number): Promise<GoalProgress[]>;

  getFinances(userId: number): Promise<Finance[]>;
  createFinance(userId: number, finance: InsertFinance): Promise<Finance>;

  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private habits: Map<number, Habit>;
  private finances: Map<number, Finance>;
  private rewards: Map<number, HabitReward>;
  private goals: Map<number, Goal>;
  private goalProgress: Map<number, GoalProgress>;
  public sessionStore: session.Store;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.habits = new Map();
    this.finances = new Map();
    this.rewards = new Map();
    this.goals = new Map();
    this.goalProgress = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  private generateId(): number {
    return this.currentId++;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.generateId();
    const user = { id, ...insertUser };
    this.users.set(id, user);
    return user;
  }

  async getHabits(userId: number): Promise<Habit[]> {
    return Array.from(this.habits.values()).filter(
      (habit) => habit.userId === userId,
    );
  }

  async createHabit(userId: number, habit: InsertHabit): Promise<Habit> {
    const id = this.generateId();
    const newHabit = {
      id,
      userId,
      currentStreak: 0,
      completed: false,
      lastCompletedAt: null,
      longestStreak: 0,
      totalCompletions: 0,
      missedReason: null,
      ...habit,
    };
    this.habits.set(id, newHabit);
    return newHabit;
  }

  async toggleHabit(id: number, userId: number, reflection?: string): Promise<Habit> {
    const habit = this.habits.get(id);
    if (!habit || habit.userId !== userId) {
      throw new Error("Habit not found");
    }

    const now = new Date();
    const canToggleToday = !habit.lastCompletedAt || !isSameDay(now, new Date(habit.lastCompletedAt));

    if (!canToggleToday) {
      throw new Error("Habit can only be toggled once per day");
    }

    let currentStreak = habit.currentStreak;
    let totalCompletions = habit.totalCompletions;

    if (!habit.completed) {
      currentStreak++;
      totalCompletions++;
      const milestone = STREAK_REWARDS.find(r => r.streakRequired === currentStreak);
      if (milestone) {
        const rewardId = this.generateId();
        const randomReward = milestone.rewards[Math.floor(Math.random() * milestone.rewards.length)];
        this.rewards.set(rewardId, {
          id: rewardId,
          userId,
          habitId: id,
          rewardTitle: randomReward,
          description: `Reward for maintaining a ${currentStreak}-day streak!`,
          streakRequired: milestone.streakRequired,
          claimed: false,
          claimedAt: null,
        });
      }
    } else {
      currentStreak = Math.max(0, currentStreak - 1);
    }

    const updated = {
      ...habit,
      completed: !habit.completed,
      currentStreak,
      totalCompletions,
      longestStreak: Math.max(habit.longestStreak, currentStreak),
      lastCompletedAt: now,
      missedReason: reflection ?? null,
    };
    this.habits.set(id, updated);
    return updated;
  }

  async getGoals(userId: number): Promise<Goal[]> {
    return Array.from(this.goals.values()).filter(
      (goal) => goal.userId === userId
    );
  }

  async createGoal(userId: number, goal: InsertGoal): Promise<Goal> {
    const id = this.generateId();
    const newGoal = {
      id,
      userId,
      currentAmount: 0,
      completed: false,
      createdAt: new Date(),
      ...goal,
    };
    this.goals.set(id, newGoal);
    return newGoal;
  }

  async updateGoalProgress(userId: number, progress: InsertGoalProgress): Promise<GoalProgress> {
    const id = this.generateId();
    const newProgress = {
      id,
      userId,
      ...progress,
    };
    this.goalProgress.set(id, newProgress);

    const goal = this.goals.get(progress.goalId);
    if (goal) {
      const updatedGoal = {
        ...goal,
        currentAmount: parseFloat(goal.currentAmount.toString()) + parseFloat(progress.amount.toString()),
        completed: parseFloat(goal.currentAmount.toString()) + parseFloat(progress.amount.toString()) >= parseFloat(goal.targetAmount.toString()),
      };
      this.goals.set(goal.id, updatedGoal);
    }

    return newProgress;
  }

  async getGoalProgress(goalId: number, userId: number): Promise<GoalProgress[]> {
    return Array.from(this.goalProgress.values()).filter(
      (progress) => progress.goalId === goalId && progress.userId === userId
    );
  }

  async getFinances(userId: number): Promise<Finance[]> {
    return Array.from(this.finances.values()).filter(
      (finance) => finance.userId === userId,
    );
  }

  async createFinance(userId: number, finance: InsertFinance): Promise<Finance> {
    const id = this.generateId();
    const newFinance = { id, userId, ...finance };
    this.finances.set(id, newFinance);
    return newFinance;
  }

  async getHabitRewards(userId: number): Promise<HabitReward[]> {
    return Array.from(this.rewards.values()).filter(
      (reward) => reward.userId === userId && !reward.claimed
    );
  }

  async claimReward(rewardId: number, userId: number): Promise<HabitReward> {
    const reward = this.rewards.get(rewardId);
    if (!reward || reward.userId !== userId) {
      throw new Error("Reward not found");
    }

    if (reward.claimed) {
      throw new Error("Reward already claimed");
    }

    const updated = {
      ...reward,
      claimed: true,
      claimedAt: new Date(),
    };
    this.rewards.set(rewardId, updated);
    return updated;
  }
}

export const storage = new MemStorage();