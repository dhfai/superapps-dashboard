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
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Financial Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your income, expenses, goals, and investments all in one place
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 flex-wrap">
          <Button onClick={() => router.push('/dashboard/financial/transactions')} className="gap-2">
            <IconPlus className="w-4 h-4" />
            Add Transaction
          </Button>
          <Button variant="outline" onClick={() => router.push('/dashboard/financial/daily-targets')} className="gap-2">
            <IconTarget className="w-4 h-4" />
            Set Daily Target
          </Button>
          <Button variant="outline" onClick={() => router.push('/dashboard/financial/goals')} className="gap-2">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Income */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <IconTrendingUp className="w-4 h-4 text-green-500" />
              Today's Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.todayIncome)}</div>
            {todayTarget && (
              <p className="text-xs text-muted-foreground mt-1">
                Target: {formatCurrency(todayTarget.income_target)} ({todayTarget.income_progress?.toFixed(0)}%)
              </p>
            )}
          </CardContent>
        </Card>

        {/* Today's Expense */}
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <IconTrendingDown className="w-4 h-4 text-red-500" />
              Today's Expense
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.todayExpense)}</div>
            {todayTarget && (
              <p className="text-xs text-muted-foreground mt-1">
                Limit: {formatCurrency(todayTarget.expense_limit)} ({todayTarget.expense_progress?.toFixed(0)}%)
              </p>
            )}
          </CardContent>
        </Card>

        {/* Month's Balance */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <IconWallet className="w-4 h-4 text-blue-500" />
              Monthly Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.monthNet >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(stats.monthNet)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              In: {formatCurrency(stats.monthIncome)} | Out: {formatCurrency(stats.monthExpense)}
            </p>
          </CardContent>
        </Card>

        {/* Active Goals */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <IconTarget className="w-4 h-4 text-purple-500" />
              Active Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.activeGoals}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.completedGoals} completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <IconChartPie className="w-5 h-5" />
                Recent Transactions
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/financial/transactions')}>
                View All <IconArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <CardDescription>Your latest financial activities</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No transactions yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => router.push('/dashboard/financial/transactions')}
                >
                  Add First Transaction
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                          {transaction.type}
                        </Badge>
                        <span className="font-medium">{transaction.category}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{transaction.description || 'No description'}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(transaction.date)}</p>
                    </div>
                    <div className={`text-lg font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Goals */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <IconTarget className="w-5 h-5" />
                Active Goals
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/financial/goals')}>
                View All <IconArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <CardDescription>Track your financial objectives</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingGoals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No active goals</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => router.push('/dashboard/financial/goals')}
                >
                  Create First Goal
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingGoals.map((goal) => (
                  <div key={goal.id} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold">{goal.title}</h4>
                        <p className="text-sm text-muted-foreground">{goal.category}</p>
                      </div>
                      <Badge variant={goal.priority === 2 ? 'destructive' : goal.priority === 1 ? 'default' : 'secondary'}>
                        {goal.priority_label}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{goal.progress?.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(goal.progress || 0, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}</span>
                        <span>{goal.days_remaining} days left</span>
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
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/financial/budgets')}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <IconChartPie className="w-5 h-5 text-blue-500" />
              Budget Management
            </CardTitle>
            <CardDescription>Set and track category budgets</CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/financial/daily-targets')}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <IconTarget className="w-5 h-5 text-green-500" />
              Daily Targets
            </CardTitle>
            <CardDescription>Track daily financial goals</CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/financial/backtest')}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <IconTrendingUp className="w-5 h-5 text-purple-500" />
              Backtest Strategies
            </CardTitle>
            <CardDescription>Analyze investment scenarios</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
