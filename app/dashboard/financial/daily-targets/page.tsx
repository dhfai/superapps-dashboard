"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IconTarget, IconPlus, IconTrash, IconTrendingUp, IconTrendingDown, IconChartLine, IconCheck, IconX, IconChartCandle, IconHistory, IconDeviceFloppy, IconCurrencyDollar, IconCurrencyEuro, IconCurrencyPound, IconCurrencyYen, IconCurrencyFrank, IconCoin, IconDiamond, IconCurrency } from "@tabler/icons-react";
import { dailyTargetService, DailyTarget, tradingActivityService } from "@/lib/api/finance";
import { toast } from "sonner";
import { format } from "date-fns";

// Trading pairs with icons and categories
const TRADING_PAIRS = [
  { value: "EUR/USD", label: "EUR/USD", icon: IconCurrencyEuro, category: "Major" },
  { value: "GBP/USD", label: "GBP/USD", icon: IconCurrencyPound, category: "Major" },
  { value: "USD/JPY", label: "USD/JPY", icon: IconCurrencyYen, category: "Major" },
  { value: "USD/CHF", label: "USD/CHF", icon: IconCurrencyFrank, category: "Major" },
  { value: "AUD/USD", label: "AUD/USD", icon: IconCurrencyDollar, category: "Major" },
  { value: "USD/CAD", label: "USD/CAD", icon: IconCurrencyDollar, category: "Major" },
  { value: "NZD/USD", label: "NZD/USD", icon: IconCurrencyDollar, category: "Major" },
  { value: "EUR/GBP", label: "EUR/GBP", icon: IconCurrencyEuro, category: "Cross" },
  { value: "EUR/JPY", label: "EUR/JPY", icon: IconCurrencyEuro, category: "Cross" },
  { value: "GBP/JPY", label: "GBP/JPY", icon: IconCurrencyPound, category: "Cross" },
  { value: "XAU/USD", label: "XAU/USD (Gold)", icon: IconDiamond, category: "Commodity" },
  { value: "BTC/USD", label: "BTC/USD (Bitcoin)", icon: IconCurrency, category: "Crypto" },
  { value: "ETH/USD", label: "ETH/USD (Ethereum)", icon: IconCoin, category: "Crypto" },
];

// Helper function to get pair icon
const getPairIcon = (symbol: string) => {
  const pair = TRADING_PAIRS.find(p => p.value === symbol);
  if (!pair) return IconCurrencyDollar;
  return pair.icon;
};

// Time sessions
const TRADING_SESSIONS = [
  { value: "asian", label: "Asian (00:00-09:00)" },
  { value: "london", label: "London (08:00-17:00)" },
  { value: "newyork", label: "New York (13:00-22:00)" },
  { value: "custom", label: "Custom Time" }
];

export default function DailyTargetsPage() {
  const [targets, setTargets] = useState<any[]>([]);
  const [todayTarget, setTodayTarget] = useState<any>(null);
  const [monthSummary, setMonthSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Create Target Dialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // History Drawer
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  // Trading Activities for today
  const [tradingActivities, setTradingActivities] = useState<any[]>([]);

  // Delete Confirmation Dialogs
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    type: 'target' | 'trade' | null;
    item: any;
  }>({
    isOpen: false,
    type: null,
    item: null,
  });

  const [formData, setFormData] = useState<any>({
    date: format(new Date(), "yyyy-MM-dd'T'00:00:00'Z'"),
    income_target: "",
    expense_limit: "",
    savings_target: "",
    notes: "",
  });

  const [tradeFormData, setTradeFormData] = useState({
    trade_type: "win" as "win" | "loss",
    amount: "",
    pips: "",
    lot_size: "",
    symbol: "",
    description: "",
    trade_time: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch month summary
      try {
        const monthRes = await dailyTargetService.getMonthSummary();
        setMonthSummary(monthRes.data);
      } catch (error) {
        console.log("No month summary");
      }

      // Fetch all targets for this month
      const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];
      const targetsRes = await dailyTargetService.getAll(firstDay, lastDay, 1, 31);
      setTargets(targetsRes.data.targets || []);

      // Find today's target
      const today = format(new Date(), "yyyy-MM-dd");
      const targetToday = targetsRes.data.targets?.find((t: any) => {
        const targetDate = format(new Date(t.date), "yyyy-MM-dd");
        return targetDate === today;
      });

      setTodayTarget(targetToday || null);

      // Fetch today's trades if target exists
      if (targetToday) {
        try {
          const tradesRes = await dailyTargetService.getTrades(targetToday.id);
          setTradingActivities(tradesRes.data || []);
        } catch (error) {
          console.error("Error fetching trades:", error);
          setTradingActivities([]);
        }
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error(error.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);

      // Convert string values to numbers
      const submitData = {
        date: formData.date,
        income_target: parseFloat(formData.income_target) || 0,
        expense_limit: parseFloat(formData.expense_limit) || 0,
        savings_target: parseFloat(formData.savings_target) || 0,
        notes: formData.notes,
      };

      await dailyTargetService.create(submitData);
      toast.success("Target created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error("Target already exists for this date");
      } else {
        toast.error(error.response?.data?.message || error.message || "Failed to create target");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, target: any) => {
    setDeleteDialog({
      isOpen: true,
      type: 'target',
      item: { id, target },
    });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.item) return;

    try {
      if (deleteDialog.type === 'target') {
        await dailyTargetService.delete(Number(deleteDialog.item.id));
        toast.success("Target deleted successfully");
      } else if (deleteDialog.type === 'trade') {
        await tradingActivityService.delete(Number(deleteDialog.item.id));
        toast.success("Trade deleted successfully");
      }

      setDeleteDialog({ isOpen: false, type: null, item: null });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Failed to delete");
      fetchData();
    }
  };

  const handleSubmitTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !todayTarget) return;

    try {
      setSubmitting(true);

      // Convert string values to numbers
      const submitData = {
        trade_type: tradeFormData.trade_type,
        amount: parseFloat(tradeFormData.amount) || 0,
        pips: parseFloat(tradeFormData.pips) || 0,
        lot_size: parseFloat(tradeFormData.lot_size) || 0,
        symbol: tradeFormData.symbol,
        description: tradeFormData.description,
        trade_time: tradeFormData.trade_time,
      };

      await dailyTargetService.addTrade(todayTarget.id, submitData);
      toast.success(`${tradeFormData.trade_type === "win" ? "Win" : "Loss"} trade recorded successfully`);
      resetTradeForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Failed to record trade");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTrade = async (tradeId: string, trade: any) => {
    if (!todayTarget) return;

    setDeleteDialog({
      isOpen: true,
      type: 'trade',
      item: { id: tradeId, trade },
    });
  };

  const resetForm = () => {
    setFormData({
      date: format(new Date(), "yyyy-MM-dd'T'00:00:00'Z'"),
      income_target: "",
      expense_limit: "",
      savings_target: "",
      notes: "",
    });
  };

  const resetTradeForm = () => {
    setTradeFormData({
      trade_type: "win",
      amount: "",
      pips: "",
      lot_size: "",
      symbol: "",
      description: "",
      trade_time: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    });
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
      month: 'long',
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
    <div className="space-y-6 p-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <IconChartCandle className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Trading Targets
            </h1>
          </div>
          <p className="text-muted-foreground ml-[52px]">
            {format(new Date(), "EEEE, dd MMMM yyyy")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* History Button */}
          <Button
            variant="outline"
            size="default"
            className="gap-2"
            onClick={() => setIsHistoryDrawerOpen(true)}
          >
            <IconHistory className="w-4 h-4" />
            History
          </Button>

          {/* Create Target Dialog - Only show if no target today */}
          {!todayTarget && (
            <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
              setIsCreateDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button size="default" className="gap-2">
                  <IconPlus className="w-4 h-4" />
                  Create Target
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create Trading Target</DialogTitle>
                  <DialogDescription>
                    Set your profit target and loss limit for the day
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date ? format(new Date(formData.date), "yyyy-MM-dd") : ""}
                        onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value).toISOString() })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="income_target">Profit Target (IDR) *</Label>
                      <Input
                        id="income_target"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.income_target}
                        onChange={(e) => setFormData({ ...formData, income_target: e.target.value })}
                        required
                        placeholder="e.g. 1000000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expense_limit">Loss Limit / Stop Loss (IDR) *</Label>
                      <Input
                        id="expense_limit"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.expense_limit}
                        onChange={(e) => setFormData({ ...formData, expense_limit: e.target.value })}
                        required
                        placeholder="e.g. 500000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="savings_target">Savings Target (IDR) *</Label>
                      <Input
                        id="savings_target"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.savings_target}
                        onChange={(e) => setFormData({ ...formData, savings_target: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes / Trading Plan</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Your trading strategy, market conditions, plan for the day..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating...
                        </>
                      ) : (
                        "Create"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Monthly Summary Stats */}
      {/* {monthSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-xs font-medium flex items-center gap-1.5 text-green-600">
                <IconCheck className="w-3.5 h-3.5" />
                Targets Hit
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-green-600">
                {monthSummary.days_met_income} / {monthSummary.total_days}
              </CardTitle>
              <CardDescription className="text-xs mt-2">
                Total: <span className="font-semibold">{formatCurrency(monthSummary.total_actual_income)}</span>
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-xs font-medium flex items-center gap-1.5">
                <IconTrendingDown className="w-3.5 h-3.5" />
                Within Limit
              </CardDescription>
              <CardTitle className="text-2xl font-bold">
                {monthSummary.days_met_expense} / {monthSummary.total_days}
              </CardTitle>
              <CardDescription className="text-xs mt-2">
                Loss: <span className="font-semibold text-red-600">{formatCurrency(monthSummary.total_actual_expense)}</span>
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-xs font-medium flex items-center gap-1.5">
                <IconTrendingUp className="w-3.5 h-3.5" />
                Net P/L
              </CardDescription>
              <CardTitle className={`text-2xl font-bold ${
                (monthSummary.total_actual_income - monthSummary.total_actual_expense) >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                {formatCurrency(monthSummary.total_actual_income - monthSummary.total_actual_expense)}
              </CardTitle>
              <CardDescription className="text-xs mt-2">
                Target: <span className="font-semibold">{formatCurrency(monthSummary.total_income_target)}</span>
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-xs font-medium flex items-center gap-1.5">
                <IconTarget className="w-3.5 h-3.5" />
                Savings
              </CardDescription>
              <CardTitle className="text-2xl font-bold">
                {monthSummary.days_met_savings} / {monthSummary.total_days}
              </CardTitle>
              <CardDescription className="text-xs mt-2">
                <span className="font-semibold">{formatCurrency(monthSummary.total_actual_savings)}</span>
                {" / "}{formatCurrency(monthSummary.total_savings_target)}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      )} */}

      {/* Today's Target Section */}
      {!todayTarget ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconTarget className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Target for Today</h3>
            <p className="text-muted-foreground text-center mb-6">
              You haven't created a trading target for today yet.<br />
              Create one to start tracking your trading activities.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
              <IconPlus className="w-4 h-4" />
              Create Today's Target
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Today's Target Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Today's Target - {formatDate(todayTarget.date)}</CardTitle>
                  <CardDescription className="mt-1">
                    {todayTarget.is_completed ? (
                      <Badge variant={todayTarget.actual_income >= todayTarget.income_target ? "default" : "destructive"}>
                        {todayTarget.actual_income >= todayTarget.income_target ? "🎯 Target Reached" : "🛑 Stop Loss Hit"}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        ⚡ Active
                      </Badge>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Progress Bars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Profit Progress */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-green-600">Profit Progress</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(todayTarget.actual_income || 0)} / {formatCurrency(todayTarget.income_target)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">
                        {((todayTarget.actual_income || 0) / todayTarget.income_target * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Remaining: {formatCurrency(Math.max(0, todayTarget.income_target - (todayTarget.actual_income || 0)))}
                      </p>
                    </div>
                  </div>
                  <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(((todayTarget.actual_income || 0) / todayTarget.income_target * 100), 100)}%` }}
                    />
                  </div>
                </div>

                {/* Loss Progress */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-red-600">Loss Limit</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(todayTarget.actual_expense || 0)} / {formatCurrency(todayTarget.expense_limit)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">
                        {((todayTarget.actual_expense || 0) / todayTarget.expense_limit * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Remaining: {formatCurrency(Math.max(0, todayTarget.expense_limit - (todayTarget.actual_expense || 0)))}
                      </p>
                    </div>
                  </div>
                  <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`absolute inset-0 rounded-full transition-all duration-500 ${
                        ((todayTarget.actual_expense || 0) / todayTarget.expense_limit * 100) >= 80
                          ? 'bg-gradient-to-r from-red-600 to-rose-600'
                          : 'bg-gradient-to-r from-orange-500 to-red-500'
                      }`}
                      style={{ width: `${Math.min(((todayTarget.actual_expense || 0) / todayTarget.expense_limit * 100), 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 rounded-lg bg-muted/30">
                <div className="space-y-1 text-center">
                  <p className="text-xs text-muted-foreground">Net P/L</p>
                  <p className={`text-lg font-bold ${
                    ((todayTarget.actual_income || 0) - (todayTarget.actual_expense || 0)) >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {formatCurrency((todayTarget.actual_income || 0) - (todayTarget.actual_expense || 0))}
                  </p>
                </div>
                <div className="space-y-1 text-center">
                  <p className="text-xs text-muted-foreground">Total Trades</p>
                  <p className="text-lg font-bold">{todayTarget.total_trades || 0}</p>
                </div>
                <div className="space-y-1 text-center">
                  <p className="text-xs text-muted-foreground">Wins / Losses</p>
                  <p className="text-lg font-bold">
                    <span className="text-green-600">{todayTarget.total_wins || 0}</span>
                    {" / "}
                    <span className="text-red-600">{todayTarget.total_losses || 0}</span>
                  </p>
                </div>
                <div className="space-y-1 text-center">
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                  <p className={`text-lg font-bold ${(todayTarget.win_rate || 0) >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                    {(todayTarget.win_rate || 0).toFixed(1)}%
                  </p>
                </div>
              </div>

              {todayTarget.notes && (
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Trading Plan:</p>
                  <p className="text-sm">{todayTarget.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Trades Table with Inline Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Today's Trades</CardTitle>
              <CardDescription>{tradingActivities.length} trade{tradingActivities.length !== 1 ? 's' : ''} recorded</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Type</TableHead>
                      <TableHead className="w-[140px]">Amount</TableHead>
                      <TableHead className="w-[100px]">Pips</TableHead>
                      <TableHead className="w-[100px]">Lot Size</TableHead>
                      <TableHead className="w-[130px]">Symbol</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[180px]">Time</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Input Row - Always visible at top */}
                    {!todayTarget.is_completed && (
                      <TableRow className="bg-muted/30">
                        <TableCell>
                          <Select
                            value={tradeFormData.trade_type}
                            onValueChange={(value: "win" | "loss") => setTradeFormData({ ...tradeFormData, trade_type: value })}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="win">
                                <div className="flex items-center gap-2">
                                  <IconTrendingUp className="w-3 h-3" />
                                  Win
                                </div>
                              </SelectItem>
                              <SelectItem value="loss">
                                <div className="flex items-center gap-2">
                                  <IconTrendingDown className="w-3 h-3" />
                                  Loss
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={tradeFormData.amount}
                            onChange={(e) => setTradeFormData({ ...tradeFormData, amount: e.target.value })}
                            placeholder="Amount"
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            value={tradeFormData.pips}
                            onChange={(e) => setTradeFormData({ ...tradeFormData, pips: e.target.value })}
                            placeholder="Pips"
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={tradeFormData.lot_size}
                            onChange={(e) => setTradeFormData({ ...tradeFormData, lot_size: e.target.value })}
                            placeholder="Lot"
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={tradeFormData.symbol}
                            onValueChange={(value) => setTradeFormData({ ...tradeFormData, symbol: value })}
                          >
                            <SelectTrigger className="h-8">
                              {tradeFormData.symbol ? (
                                <div className="flex items-center gap-2">
                                  {(() => {
                                    const PairIcon = getPairIcon(tradeFormData.symbol);
                                    return <PairIcon className="w-3.5 h-3.5" />;
                                  })()}
                                  <span>{tradeFormData.symbol}</span>
                                </div>
                              ) : (
                                <SelectValue placeholder="Select Pair" />
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              {TRADING_PAIRS.map((pair) => {
                                const Icon = pair.icon;
                                return (
                                  <SelectItem key={pair.value} value={pair.value}>
                                    <div className="flex items-center gap-2">
                                      <Icon className="w-4 h-4" />
                                      <span>{pair.label}</span>
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            value={tradeFormData.description}
                            onChange={(e) => setTradeFormData({ ...tradeFormData, description: e.target.value })}
                            placeholder="Notes..."
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="time"
                            value={tradeFormData.trade_time ? format(new Date(tradeFormData.trade_time), "HH:mm") : ""}
                            onChange={(e) => {
                              const today = format(new Date(), "yyyy-MM-dd");
                              const newDateTime = new Date(`${today}T${e.target.value}:00`).toISOString();
                              setTradeFormData({ ...tradeFormData, trade_time: newDateTime });
                            }}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              if (!tradeFormData.amount || parseFloat(tradeFormData.amount) <= 0) {
                                toast.error("Please enter amount");
                                return;
                              }
                              handleSubmitTrade(e as any);
                            }}
                            disabled={submitting || !tradeFormData.amount}
                            className="h-8 gap-1"
                          >
                            {submitting ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                            ) : (
                              <>
                                <IconDeviceFloppy className="w-3 h-3" />
                                Save
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    )}

                    {/* Existing Trades */}
                    {tradingActivities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          {todayTarget.is_completed ? "No trades recorded" : "Start recording your trades above"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      tradingActivities.map((trade) => (
                        <TableRow key={trade.id}>
                          <TableCell>
                            <Badge variant={trade.trade_type === "win" ? "default" : "destructive"} className="gap-1">
                              {trade.trade_type === "win" ? (
                                <><IconTrendingUp className="w-3 h-3" />Win</>
                              ) : (
                                <><IconTrendingDown className="w-3 h-3" />Loss</>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className={`font-semibold ${trade.trade_type === "win" ? "text-green-600" : "text-red-600"}`}>
                            {formatCurrency(trade.amount)}
                          </TableCell>
                          <TableCell>{trade.pips || "-"}</TableCell>
                          <TableCell>{trade.lot_size || "-"}</TableCell>
                          <TableCell>
                            {trade.symbol ? (
                              <Badge variant="outline" className="font-mono text-xs gap-1.5">
                                {(() => {
                                  const PairIcon = getPairIcon(trade.symbol);
                                  return <PairIcon className="w-3 h-3" />;
                                })()}
                                {trade.symbol}
                              </Badge>
                            ) : "-"}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                            {trade.description || "-"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {format(new Date(trade.trade_time), "HH:mm")}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTrade(trade.id, trade)}
                              disabled={todayTarget.is_completed}
                              className="hover:bg-destructive/10 hover:text-destructive h-8"
                            >
                              <IconTrash className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* History Drawer */}
      <Sheet open={isHistoryDrawerOpen} onOpenChange={setIsHistoryDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <IconHistory className="w-5 h-5" />
              Trading History
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-3">
            {targets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No trading history yet</p>
              </div>
            ) : (
              targets.map((target) => (
                <Card key={target.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{formatDate(target.date)}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {target.total_trades || 0} trades • Win rate: {(target.win_rate || 0).toFixed(1)}%
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {target.is_completed && (
                          <Badge variant={target.actual_income >= target.income_target ? "default" : "destructive"} className="text-xs">
                            {target.actual_income >= target.income_target ? <><IconCheck className="w-3 h-3 mr-1" />Hit</> : <><IconX className="w-3 h-3 mr-1" />Missed</>}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(target.id, target)}
                          className="hover:bg-destructive/10 hover:text-destructive"
                        >
                          <IconTrash className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground">Target:</p>
                        <p className="font-semibold text-green-600">{formatCurrency(target.income_target)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Actual:</p>
                        <p className="font-semibold text-green-600">{formatCurrency(target.actual_income || 0)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Loss Limit:</p>
                        <p className="font-semibold text-red-600">{formatCurrency(target.expense_limit)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Actual Loss:</p>
                        <p className="font-semibold text-red-600">{formatCurrency(target.actual_expense || 0)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.isOpen} onOpenChange={(open) => !open && setDeleteDialog({ isOpen: false, type: null, item: null })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <IconTrash className="w-5 h-5" />
              {deleteDialog.type === 'target' ? 'Delete Target?' : 'Delete Trade?'}
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete this {deleteDialog.type}.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {deleteDialog.type === 'target' && deleteDialog.item?.target && (
              <div className="space-y-3 p-4 rounded-lg bg-muted/50 border border-destructive/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Date</span>
                  <span className="text-sm font-semibold">{formatDate(deleteDialog.item.target.date)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Target</span>
                  <span className="text-sm font-semibold text-green-600">{formatCurrency(deleteDialog.item.target.income_target)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Trades</span>
                  <span className="text-sm font-semibold">{deleteDialog.item.target.total_trades || 0}</span>
                </div>
              </div>
            )}

            {deleteDialog.type === 'trade' && deleteDialog.item?.trade && (
              <div className="space-y-3 p-4 rounded-lg bg-muted/50 border border-destructive/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Type</span>
                  <Badge variant={deleteDialog.item.trade.trade_type === 'win' ? 'default' : 'destructive'} className="gap-1">
                    {deleteDialog.item.trade.trade_type === 'win' ? (
                      <><IconTrendingUp className="w-3 h-3" />Win</>
                    ) : (
                      <><IconTrendingDown className="w-3 h-3" />Loss</>
                    )}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Amount</span>
                  <span className={`text-sm font-semibold ${deleteDialog.item.trade.trade_type === 'win' ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(deleteDialog.item.trade.amount)}
                  </span>
                </div>
                {deleteDialog.item.trade.symbol && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Symbol</span>
                    <Badge variant="outline" className="font-mono text-xs gap-1.5">
                      {(() => {
                        const PairIcon = getPairIcon(deleteDialog.item.trade.symbol);
                        return <PairIcon className="w-3 h-3" />;
                      })()}
                      {deleteDialog.item.trade.symbol}
                    </Badge>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Time</span>
                  <span className="text-sm font-semibold">{format(new Date(deleteDialog.item.trade.trade_time), "HH:mm")}</span>
                </div>
              </div>
            )}

            <p className="text-sm text-muted-foreground mt-4 text-center">
              {deleteDialog.type === 'trade' && "This will update your daily statistics."}
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ isOpen: false, type: null, item: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="gap-2"
            >
              <IconTrash className="w-4 h-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
