import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { insertGoalSchema, type InsertGoal, type Goal, type GoalProgress, GOAL_TYPES } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Target, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function GoalForm({ goals }: { goals: Goal[] }) {
  const { toast } = useToast();
  const form = useForm<InsertGoal>({
    resolver: zodResolver(insertGoalSchema),
    defaultValues: {
      title: "",
      description: "",
      type: GOAL_TYPES[0],
      targetAmount: "0",
      targetDate: new Date(),
      dailyTargetHours: "0",
    },
  });

  const createGoal = useMutation({
    mutationFn: async (data: InsertGoal) => {
      const res = await apiRequest("POST", "/api/goals", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      form.reset();
      toast({
        title: "Goal created",
        description: "Your new goal has been created successfully.",
      });
    },
  });

  const updateProgress = useMutation({
    mutationFn: async ({ goalId, amount, notes }: { goalId: number; amount: string; notes?: string }) => {
      const res = await apiRequest("POST", `/api/goals/${goalId}/progress`, {
        amount,
        notes,
        date: new Date(),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({
        title: "Progress updated",
        description: "Your goal progress has been updated.",
      });
    },
  });

  const getProgressData = (goal: Goal) => {
    const { data: progress = [] } = useQuery<GoalProgress[]>({
      queryKey: ["/api/goals", goal.id, "progress"],
    });

    return progress.map((p) => ({
      date: format(new Date(p.date), "MMM d"),
      amount: parseFloat(p.amount?.toString() || "0"),
    }));
  };

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => createGoal.mutate(data))} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Title</FormLabel>
                  <FormControl>
                    <Input className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {GOAL_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-[100px] resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("type") === "Financial" && (
              <FormField
                control={form.control}
                name="targetAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Amount ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        className="h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {form.watch("type") === "Skill Development" && (
              <FormField
                control={form.control}
                name="dailyTargetHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily Target Hours</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        className="h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="targetDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      className="h-11"
                      {...field}
                      value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" disabled={createGoal.isPending} className="w-full h-11 group">
            {createGoal.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Target className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
            )}
            Add Goal
          </Button>
        </form>
      </Form>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Your Goals
        </h3>

        <AnimatePresence>
          {goals.map((goal, index) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-lg">{goal.title}</h4>
                      <p className="text-sm text-muted-foreground">{goal.description}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Type:</span>
                        <span className="text-primary">{goal.type}</span>
                        {goal.targetDate && (
                          <span className="text-muted-foreground">
                            • Due {format(new Date(goal.targetDate), "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const amount = prompt(
                          goal.type === "Financial"
                            ? "Enter amount saved ($):"
                            : "Enter hours spent:"
                        );
                        if (amount) {
                          updateProgress.mutate({
                            goalId: goal.id,
                            amount,
                          });
                        }
                      }}
                      disabled={updateProgress.isPending}
                    >
                      Update Progress
                    </Button>
                  </div>

                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getProgressData(goal)}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)"
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="amount"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ fill: "hsl(var(--primary))" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">Progress: </span>
                      {goal.type === "Financial" ? (
                        <span>
                          ${parseFloat(goal.currentAmount?.toString() || "0").toFixed(2)} /
                          ${parseFloat(goal.targetAmount?.toString() || "0").toFixed(2)}
                        </span>
                      ) : (
                        <span>
                          {parseFloat(goal.currentAmount?.toString() || "0").toFixed(1)} hours /
                          {parseFloat(goal.dailyTargetHours?.toString() || "0").toFixed(1)} hours per day
                        </span>
                      )}
                    </div>
                    <span className={`font-medium ${goal.completed ? "text-primary" : "text-muted-foreground"}`}>
                      {goal.completed ? "Completed!" : "In Progress"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {goals.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-muted-foreground"
          >
            No goals created yet. Start by adding your first goal above!
          </motion.div>
        )}
      </div>
    </div>
  );
}
