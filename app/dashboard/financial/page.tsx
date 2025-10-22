"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  IconTrendingUp,
  IconTrendingDown,
  IconWallet,
  IconTarget,
  IconChartPie,
  IconArrowRight,
  IconPlus,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { transactionService, dailyTargetService, financialGoalService, budgetService } from "@/lib/api/finance";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface DashboardStats {
  todayIncome: number;
  todayExpense: number;
  todayNet: number;
  monthIncome: number;
  monthExpense: number;
  monthNet: number;
  activeGoals: number;
  completedGoals: number;
  budgetAlerts: number;
}

export default function FinancialManagementPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    todayIncome: 0,
    todayExpense: 0,
    todayNet: 0,
    monthIncome: 0,
    monthExpense: 0,
    monthNet: 0,
    activeGoals: 0,
    completedGoals: 0,
    budgetAlerts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [todayTarget, setTodayTarget] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [upcomingGoals, setUpcomingGoals] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch today's transactions
      const today = new Date().toISOString().split('T')[0];
      const todayTrans = await transactionService.getSummary(today, today);

      // Fetch month's transactions
      const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];
      const monthTrans = await transactionService.getSummary(firstDay, lastDay);

      // Fetch today's target
      try {
        const targetRes = await dailyTargetService.getToday();
        setTodayTarget(targetRes.data);
      } catch (error) {
        console.log("No target for today");
      }

      // Fetch goals summary
      const goalsSummary = await financialGoalService.getSummary();

      // Fetch budget alerts
      let alertsCount = 0;
      try {
        const alerts = await budgetService.getAlerts(80);
        // Handle different response structures
        if (alerts.data && Array.isArray(alerts.data)) {
          alertsCount = alerts.data.length;
        } else if (Array.isArray(alerts)) {
          alertsCount = alerts.length;
        }
      } catch (error) {
        console.log("No budget alerts");
      }

      // Fetch recent transactions
      const recentTrans = await transactionService.getAll({ page: 1, page_size: 5, sort_by: 'date', sort_order: 'desc' });
      setRecentTransactions(recentTrans.data.transactions || []);

      // Fetch upcoming goals
      const goals = await financialGoalService.getAll({ is_completed: false, page: 1, page_size: 3 });
      setUpcomingGoals(goals.data.goals || []);

      setStats({
        todayIncome: todayTrans.data.total_income || 0,
        todayExpense: todayTrans.data.total_expense || 0,
        todayNet: todayTrans.data.net_balance || 0,
        monthIncome: monthTrans.data.total_income || 0,
        monthExpense: monthTrans.data.total_expense || 0,
        monthNet: monthTrans.data.net_balance || 0,
        activeGoals: goalsSummary.data.active_goals || 0,
        completedGoals: goalsSummary.data.completed_goals || 0,
        budgetAlerts: alertsCount,
      });
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      toast.error(error.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Financial Management
          </h1>
          <p className="text-muted-foreground">
            Track your income, expenses, goals, and investments all in one place
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => router.push('/dashboard/financial/transactions')} size="sm" className="gap-2 shadow-sm">
            <IconPlus className="w-4 h-4" />
            Add Transaction
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/financial/daily-targets')} className="gap-2">
            <IconTarget className="w-4 h-4" />
            Set Daily Target
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/financial/goals')} className="gap-2">
            <IconTrendingUp className="w-4 h-4" />
            Create Goal
          </Button>
        </div>
      </div>

      {/* Budget Alerts */}
      {stats.budgetAlerts > 0 && (
        <Card className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <IconAlertTriangle className="w-6 h-6 text-orange-500" />
              <div className="flex-1">
                <p className="font-semibold text-orange-900 dark:text-orange-100">Budget Alert</p>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  You have {stats.budgetAlerts} budget(s) exceeding 80% threshold
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/financial/budgets')}>
                View Budgets
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Income */}
        <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent dark:from-green-950/20" />
          <CardContent className="relative pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-green-100 dark:bg-green-950/50 group-hover:scale-110 transition-transform">
                <IconTrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              {todayTarget && (
                <Badge variant="outline" className="text-xs font-normal">
                  {todayTarget.income_progress?.toFixed(0)}%
                </Badge>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Today's Income</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(stats.todayIncome)}
              </p>
              {todayTarget && (
                <p className="text-xs text-muted-foreground">
                  of {formatCurrency(todayTarget.income_target)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Today's Expense */}
        <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-transparent dark:from-red-950/20" />
          <CardContent className="relative pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/50 group-hover:scale-110 transition-transform">
                <IconTrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              {todayTarget && (
                <Badge variant="outline" className="text-xs font-normal">
                  {todayTarget.expense_progress?.toFixed(0)}%
                </Badge>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Today's Expense</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(stats.todayExpense)}
              </p>
              {todayTarget && (
                <p className="text-xs text-muted-foreground">
                  of {formatCurrency(todayTarget.expense_limit)} limit
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Month's Balance */}
        <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-950/20" />
          <CardContent className="relative pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/50 group-hover:scale-110 transition-transform">
                <IconWallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Monthly Balance</p>
              <p className={`text-2xl font-bold ${stats.monthNet >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(stats.monthNet)}
              </p>
              <p className="text-xs text-muted-foreground">
                In: {formatCurrency(stats.monthIncome)} | Out: {formatCurrency(stats.monthExpense)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Active Goals */}
        <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent dark:from-purple-950/20" />
          <CardContent className="relative pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/50 group-hover:scale-110 transition-transform">
                <IconTarget className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Active Goals</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.activeGoals}
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.completedGoals} completed
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <IconChartPie className="w-4 h-4 text-primary" />
                  </div>
                  Recent Transactions
                </CardTitle>
                <CardDescription className="text-xs">Your latest financial activities</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/financial/transactions')} className="gap-1 text-xs">
                View All <IconArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                  <IconChartPie className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <p className="font-medium mb-1">No transactions yet</p>
                <p className="text-sm mb-4">Start tracking your finances today</p>
                <Button
                  size="sm"
                  onClick={() => router.push('/dashboard/financial/transactions')}
                  className="gap-2"
                >
                  <IconPlus className="w-4 h-4" />
                  Add First Transaction
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/50 bg-card hover:bg-accent/30 transition-all duration-200 group cursor-pointer"
                    onClick={() => router.push('/dashboard/financial/transactions')}
                  >
                    <div className={`p-2 rounded-lg ${transaction.type === 'income' ? 'bg-green-100 dark:bg-green-950/50' : 'bg-red-100 dark:bg-red-950/50'}`}>
                      {transaction.type === 'income' ? (
                        <IconTrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <IconTrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm truncate">{transaction.category}</span>
                        <Badge
                          variant={transaction.type === 'income' ? 'default' : 'destructive'}
                          className="text-[10px] px-1.5 py-0 h-5"
                        >
                          {transaction.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {transaction.description || 'No description'}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(transaction.date)}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-base font-bold ${transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount).replace('Rp', '').trim()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Goals */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/50">
                    <IconTarget className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  Active Goals
                </CardTitle>
                <CardDescription className="text-xs">Track your financial objectives</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/financial/goals')} className="gap-1 text-xs">
                View All <IconArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingGoals.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                  <IconTarget className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <p className="font-medium mb-1">No active goals</p>
                <p className="text-sm mb-4">Set your financial targets today</p>
                <Button
                  size="sm"
                  onClick={() => router.push('/dashboard/financial/goals')}
                  className="gap-2"
                >
                  <IconPlus className="w-4 h-4" />
                  Create First Goal
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className="p-4 rounded-lg border hover:border-purple-500/50 bg-card hover:bg-accent/30 transition-all duration-200 group cursor-pointer"
                    onClick={() => router.push('/dashboard/financial/goals')}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm mb-1 truncate">{goal.title}</h4>
                        <p className="text-xs text-muted-foreground">{goal.category}</p>
                      </div>
                      <Badge
                        variant={goal.priority === 2 ? 'destructive' : goal.priority === 1 ? 'default' : 'secondary'}
                        className="text-[10px] px-2 py-0.5 h-5 ml-2"
                      >
                        {goal.priority_label}
                      </Badge>
                    </div>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-medium">Progress</span>
                        <span className="font-bold text-purple-600 dark:text-purple-400">{goal.progress?.toFixed(1)}%</span>
                      </div>
                      <div className="relative">
                        <div className="w-full bg-secondary/50 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-purple-500 via-purple-600 to-blue-500 h-2 rounded-full transition-all duration-500 relative overflow-hidden"
                            style={{ width: `${Math.min(goal.progress || 0, 100)}%` }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div className="space-y-0.5">
                          <p className="text-xs text-muted-foreground">Current</p>
                          <p className="text-sm font-bold text-purple-600 dark:text-purple-400">
                            {formatCurrency(goal.current_amount).replace('Rp', '').trim()}
                          </p>
                        </div>
                        <div className="text-right space-y-0.5">
                          <p className="text-xs text-muted-foreground">Target</p>
                          <p className="text-sm font-bold">
                            {formatCurrency(goal.target_amount).replace('Rp', '').trim()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <IconTarget className="w-3 h-3" />
                          <span>{goal.days_remaining} days remaining</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card
          className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
          onClick={() => router.push('/dashboard/financial/budgets')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-950/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="relative">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-950/50 w-fit group-hover:scale-110 transition-transform">
                  <IconChartPie className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold mb-1">Budget Management</CardTitle>
                  <CardDescription className="text-xs">Set and track category budgets</CardDescription>
                </div>
              </div>
              <IconArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
          </CardHeader>
        </Card>

        <Card
          className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
          onClick={() => router.push('/dashboard/financial/daily-targets')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent dark:from-green-950/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="relative">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-green-100 dark:bg-green-950/50 w-fit group-hover:scale-110 transition-transform">
                  <IconTarget className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold mb-1">Daily Targets</CardTitle>
                  <CardDescription className="text-xs">Track daily financial goals</CardDescription>
                </div>
              </div>
              <IconArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
            </div>
          </CardHeader>
        </Card>

        <Card
          className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
          onClick={() => router.push('/dashboard/financial/backtest')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent dark:from-purple-950/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="relative">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-950/50 w-fit group-hover:scale-110 transition-transform">
                  <IconTrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold mb-1">Backtest Strategies</CardTitle>
                  <CardDescription className="text-xs">Analyze investment scenarios</CardDescription>
                </div>
              </div>
              <IconArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
