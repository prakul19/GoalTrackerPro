import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import HabitForm from "@/components/habit-form";
import FinanceForm from "@/components/finance-form";
import GoalForm from "@/components/goal-form";
import StatsCard from "@/components/stats-card";
import type { Habit, Finance, Goal } from "@shared/schema";
import { ThemeToggle } from "@/components/theme-toggle";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();

  const { data: habits, isLoading: habitsLoading } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  const { data: finances, isLoading: financesLoading } = useQuery<Finance[]>({
    queryKey: ["/api/finances"],
  });

  const { data: goals, isLoading: goalsLoading } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  if (habitsLoading || financesLoading || goalsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalIncome = finances?.filter(f => f.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0) ?? 0;

  const totalExpenses = finances?.filter(f => f.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0) ?? 0;

  const completedGoals = goals?.filter(g => g.completed).length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Welcome, {user?.username}!
            </h1>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button variant="outline" onClick={() => logoutMutation.mutate()}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Habits"
            value={habits?.length ?? 0}
            description="Active habits being tracked"
          />
          <StatsCard
            title="Total Income"
            value={totalIncome / 100}
            description="Current month income"
            prefix="$"
          />
          <StatsCard
            title="Total Expenses"
            value={totalExpenses / 100}
            description="Current month expenses"
            prefix="$"
          />
          <StatsCard
            title="Completed Goals"
            value={completedGoals}
            description="Achievement unlocked"
          />
        </div>

        <div className="bg-card rounded-xl p-6 shadow-sm">
          <Tabs defaultValue="habits" className="space-y-6">
            <TabsList className="inline-flex h-11 items-center justify-center rounded-lg bg-muted p-1">
              <TabsTrigger value="habits" className="rounded-md px-6">Habits</TabsTrigger>
              <TabsTrigger value="finances" className="rounded-md px-6">Finances</TabsTrigger>
              <TabsTrigger value="goals" className="rounded-md px-6">Goals</TabsTrigger>
            </TabsList>

            <TabsContent value="habits">
              <HabitForm habits={habits ?? []} />
            </TabsContent>

            <TabsContent value="finances">
              <FinanceForm finances={finances ?? []} />
            </TabsContent>

            <TabsContent value="goals">
              <GoalForm goals={goals ?? []} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}