import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { insertHabitSchema, type InsertHabit, type Habit, type HabitReward } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Check, Gift, Loader2, PartyPopper, Target, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function HabitForm({ habits }: { habits: Habit[] }) {
  const { toast } = useToast();
  const [reflectionHabit, setReflectionHabit] = useState<Habit | null>(null);
  const [showReward, setShowReward] = useState<HabitReward | null>(null);

  const form = useForm<InsertHabit>({
    resolver: zodResolver(insertHabitSchema),
    defaultValues: {
      title: "",
      description: "",
      targetFrequency: 1,
    },
  });

  const reflectionForm = useForm<{ reflection: string }>({
    defaultValues: {
      reflection: "",
    },
  });

  const { data: rewards = [] } = useQuery<HabitReward[]>({
    queryKey: ["/api/rewards"],
  });

  const createHabit = useMutation({
    mutationFn: async (data: InsertHabit) => {
      const res = await apiRequest("POST", "/api/habits", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      form.reset();
      toast({
        title: "Habit created",
        description: "Your new habit has been created successfully.",
      });
    },
  });

  const toggleHabit = useMutation({
    mutationFn: async ({ id, completed, reflection }: { id: number; completed: boolean; reflection?: string }) => {
      const res = await apiRequest("PATCH", `/api/habits/${id}/toggle`, { completed, reflection });
      return res.json();
    },
    onSuccess: (data: Habit) => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });

      // Check if we earned a reward
      const newReward = rewards.find(r => r.habitId === data.id && r.streakRequired === data.currentStreak);
      if (newReward) {
        setShowReward(newReward);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const claimReward = useMutation({
    mutationFn: async (rewardId: number) => {
      const res = await apiRequest("POST", `/api/rewards/${rewardId}/claim`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
      setShowReward(null);
      toast({
        title: "Reward claimed!",
        description: "Enjoy your well-deserved reward!",
      });
    },
  });

  const handleHabitAction = (habit: Habit, completed: boolean) => {
    if (!completed) {
      setReflectionHabit(habit);
    } else {
      toggleHabit.mutate({ id: habit.id, completed });
    }
  };

  const handleReflectionSubmit = (values: { reflection: string }) => {
    if (!reflectionHabit) return;
    toggleHabit.mutate({
      id: reflectionHabit.id,
      completed: false,
      reflection: values.reflection,
    });
    setReflectionHabit(null);
    reflectionForm.reset();
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => createHabit.mutate(data))} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Habit Title</FormLabel>
                  <FormControl>
                    <Input className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-[100px] resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetFrequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Days Per Week</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="7"
                      className="h-11"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={createHabit.isPending} className="w-full h-11 group">
              {createHabit.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Target className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
              )}
              Add Habit
            </Button>
          </form>
        </Form>
      </motion.div>

      {rewards.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-primary mb-4">
              <Gift className="h-5 w-5" />
              <h3 className="font-semibold">Available Rewards</h3>
            </div>
            <div className="space-y-3">
              {rewards.map((reward) => (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 bg-background rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{reward.rewardTitle}</p>
                    <p className="text-sm text-muted-foreground">{reward.description}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => claimReward.mutate(reward.id)}
                    disabled={claimReward.isPending}
                  >
                    Claim
                  </Button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {habits.map((habit) => (
            <motion.div
              key={habit.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              layout
            >
              <Card className="group hover:shadow-md transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <motion.h3 
                        className="font-semibold text-lg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                      >
                        {habit.title}
                      </motion.h3>
                      <p className="text-sm text-muted-foreground">{habit.description}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Streak:</span>
                        <motion.span 
                          key={habit.currentStreak}
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className={`font-bold ${habit.currentStreak > 0 ? 'text-primary' : 'text-muted-foreground'}`}
                        >
                          {habit.currentStreak} days
                        </motion.span>
                        {habit.missedReason && (
                          <span className="text-muted-foreground ml-2">
                            Last missed: {habit.missedReason}
                          </span>
                        )}
                      </div>
                      {habit.longestStreak > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Best streak: {habit.longestStreak} days
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleHabitAction(habit, false)}
                        disabled={toggleHabit.isPending || habit.completed}
                        className="transition-all duration-300 hover:scale-105 hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={habit.completed ? "default" : "outline"}
                        size="icon"
                        onClick={() => handleHabitAction(habit, true)}
                        disabled={toggleHabit.isPending}
                        className="transition-all duration-300 hover:scale-105"
                      >
                        <Check className={`h-4 w-4 ${habit.completed ? "text-white" : ""}`} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
        {habits.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-2 text-center py-8 text-muted-foreground"
          >
            No habits created yet. Start by adding your first habit above!
          </motion.div>
        )}
      </div>

      <Dialog open={!!reflectionHabit} onOpenChange={() => setReflectionHabit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>What stopped you from completing this habit?</DialogTitle>
            <DialogDescription>
              Understanding why we miss our habits helps us improve. Share your thoughts below.
            </DialogDescription>
          </DialogHeader>
          <Form {...reflectionForm}>
            <form onSubmit={reflectionForm.handleSubmit(handleReflectionSubmit)} className="space-y-4">
              <FormField
                control={reflectionForm.control}
                name="reflection"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="E.g., Lack of time, feeling tired, etc."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReflectionHabit(null)}
                >
                  Skip
                </Button>
                <Button type="submit">Submit</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showReward} onOpenChange={() => setShowReward(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PartyPopper className="h-5 w-5 text-primary" />
              Congratulations!
            </DialogTitle>
            <DialogDescription>
              {showReward?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-xl font-semibold mb-2">{showReward?.rewardTitle}</p>
            <Button
              onClick={() => showReward && claimReward.mutate(showReward.id)}
              className="w-full"
            >
              Claim Your Reward
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}