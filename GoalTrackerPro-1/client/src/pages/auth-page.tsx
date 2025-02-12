import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { Loader2, Target, LineChart, Shield } from "lucide-react";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();

  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  if (user) {
    setLocation("/");
    return null;
  }

  const onSubmit = (values: InsertUser, isLogin: boolean) => {
    if (isLogin) {
      loginMutation.mutate(values);
    } else {
      registerMutation.mutate(values);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      <div className="flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardHeader className="space-y-3">
            <div className="flex justify-center">
              <div className="bg-primary/10 p-3 rounded-2xl">
                <Shield className="w-10 h-10 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent text-center">
              HabitTrack Pro
            </CardTitle>
            <p className="text-center text-muted-foreground text-sm">
              Your personal habit and finance tracking companion
            </p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <Form {...form}>
                <TabsContent value="login">
                  <form onSubmit={form.handleSubmit((values) => onSubmit(values, true))} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" className="h-11" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" className="h-11" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-3">
                      <Button className="w-full h-11" type="submit" disabled={loginMutation.isPending}>
                        {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Login
                      </Button>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full h-11"
                        onClick={() => window.location.href = "/api/auth/google"}
                      >
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                          />
                        </svg>
                        Continue with Google
                      </Button>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={form.handleSubmit((values) => onSubmit(values, false))} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input className="h-11" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" className="h-11" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" className="h-11" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button className="w-full h-11" type="submit" disabled={registerMutation.isPending}>
                      {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Register
                    </Button>
                  </form>
                </TabsContent>
              </Form>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div className="hidden md:flex flex-col justify-center p-12 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Transform Your Life
        </h1>
        <p className="text-xl text-muted-foreground mb-12 max-w-md">
          Build better habits and achieve financial freedom with our premium tracking tools.
        </p>
        <div className="grid grid-cols-2 gap-6">
          <div className="p-6 bg-card rounded-xl shadow-sm border border-border/50 backdrop-blur-sm">
            <Target className="h-8 w-8 mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">Smart Habit Tracking</h3>
            <p className="text-sm text-muted-foreground">Build lasting habits with daily tracking and streak monitoring</p>
          </div>
          <div className="p-6 bg-card rounded-xl shadow-sm border border-border/50 backdrop-blur-sm">
            <LineChart className="h-8 w-8 mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">Financial Insights</h3>
            <p className="text-sm text-muted-foreground">Visualize spending patterns and optimize your finances</p>
          </div>
        </div>
      </div>
    </div>
  );
}