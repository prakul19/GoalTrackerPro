import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { insertFinanceSchema, type InsertFinance, type Finance } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

const categories = [
  "Salary",
  "Investment",
  "Food",
  "Transport",
  "Entertainment",
  "Bills",
  "Other",
];

export default function FinanceForm({ finances }: { finances: Finance[] }) {
  const { toast } = useToast();
  const form = useForm<InsertFinance>({
    resolver: zodResolver(insertFinanceSchema),
    defaultValues: {
      description: "",
      amount: 0,
      type: "expense",
      category: categories[0],
      date: new Date(),
    },
  });

  const createFinance = useMutation({
    mutationFn: async (data: InsertFinance) => {
      const res = await apiRequest("POST", "/api/finances", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finances"] });
      form.reset();
      toast({
        title: "Transaction added",
        description: "Your transaction has been recorded successfully.",
      });
    },
  });

  const chartData = categories.map(category => ({
    name: category,
    income: finances.filter(f => f.type === "income" && f.category === category)
      .reduce((acc, curr) => acc + curr.amount, 0) / 100,
    expense: finances.filter(f => f.type === "expense" && f.category === category)
      .reduce((acc, curr) => acc + curr.amount, 0) / 100,
  }));

  const sortedFinances = [...finances].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => createFinance.mutate(data))} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      className="h-11"
                      {...field}
                      onChange={(e) => field.onChange(Math.round(parseFloat(e.target.value) * 100))}
                    />
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
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" disabled={createFinance.isPending} className="w-full h-11">
            {createFinance.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Transaction
          </Button>
        </form>
      </Form>

      <Card>
        <CardContent className="pt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="font-semibold text-lg mb-4">Income vs Expenses by Category</h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }}
                  />
                  <Bar dataKey="income" fill="hsl(var(--primary))" name="Income" />
                  <Bar dataKey="expense" fill="hsl(var(--destructive))" name="Expense" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Recent Transactions</h3>
        <AnimatePresence>
          {sortedFinances.map((finance, index) => (
            <motion.div
              key={finance.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <Card>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="space-y-1">
                    <p className="font-medium">{finance.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {finance.category} • {format(new Date(finance.date), "MMM d, yyyy")}
                    </p>
                  </div>
                  <span className={`font-medium ${
                    finance.type === "income" ? "text-primary" : "text-destructive"
                  }`}>
                    {finance.type === "income" ? "+" : "-"}${(finance.amount / 100).toFixed(2)}
                  </span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}