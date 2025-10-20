"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { IconTarget, IconPlus, IconEdit, IconTrash, IconTrendingUp, IconTrendingDown, IconChartLine, IconCheck, IconX, IconChartCandle, IconEye } from "@tabler/icons-react";
import { dailyTargetService, DailyTarget, tradingActivityService, TradingActivity } from "@/lib/api/finance";
import { toast } from "sonner";
import { format } from "date-fns";

export default function DailyTargetsPage() {
  const [targets, setTargets] = useState<any[]>([]);
  const [monthSummary, setMonthSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Create Target Dialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Detail/View Target Sheet (Drawer from right)
  const [selectedTarget, setSelectedTarget] = useState<any>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [tradingActivities, setTradingActivities] = useState<any[]>([]);

  // Trade Dialog (inside detail dialog)
  const [isTradeDialogOpen, setIsTradeDialogOpen] = useState(false);

  const [formData, setFormData] = useState<DailyTarget>({
    date: format(new Date(), "yyyy-MM-dd'T'00:00:00'Z'"),
    income_target: 0,
    expense_limit: 0,
    savings_target: 0,
    notes: "",
  });

  const [tradeFormData, setTradeFormData] = useState({
    trade_type: "win" as "win" | "loss",
    amount: 0,
    pips: 0,
    lot_size: 0,
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
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error(error.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (target: any) => {
    setSelectedTarget(target);
    setIsDetailSheetOpen(true);

    // Fetch trades for this target
    try {
      const tradesRes = await dailyTargetService.getTrades(target.id);
      setTradingActivities(tradesRes.data || []);
    } catch (error) {
      console.error("Error fetching trades:", error);
      setTradingActivities([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);

      // Check if target already exists for this date
      const selectedDate = format(new Date(formData.date), "yyyy-MM-dd");
      const existingTarget = targets.find(t => {
        const targetDate = format(new Date(t.date), "yyyy-MM-dd");
        return targetDate === selectedDate;
      });

      if (existingTarget) {
        toast.error(`Target already exists for ${format(new Date(formData.date), "dd MMM yyyy")}`);
        setSubmitting(false);
        return;
      }

      await dailyTargetService.create(formData);
      toast.success("Target created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error("Target already exists for this date");
      } else if (error.response?.status === 404) {
        toast.error("Resource not found");
      } else {
        toast.error(error.response?.data?.message || error.message || "Failed to create target");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, target: any) => {
    const confirmMessage = `Delete target for ${formatDate(target.date)}?\n\nTarget: ${formatCurrency(target.income_target)}\nThis action cannot be undone.`;

    if (!window.confirm(confirmMessage)) return;

    try {
      await dailyTargetService.delete(Number(id));
      toast.success("Target deleted successfully");
      setTargets(targets.filter(t => t.id !== id));
      fetchData();
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error("Target not found");
      } else {
        toast.error(error.response?.data?.message || error.message || "Failed to delete target");
      }
      fetchData();
    }
  };

  const handleSubmitTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !selectedTarget) return;

    try {
      setSubmitting(true);
      await dailyTargetService.addTrade(selectedTarget.id, tradeFormData);
      toast.success(`${tradeFormData.trade_type === "win" ? "Win" : "Loss"} trade recorded successfully`);
      setIsTradeDialogOpen(false);
      resetTradeForm();

      // Refresh target detail
      const updatedTarget = await dailyTargetService.getById(selectedTarget.id);
      setSelectedTarget(updatedTarget.data);

      // Refresh trades
      const tradesRes = await dailyTargetService.getTrades(selectedTarget.id);
      setTradingActivities(tradesRes.data || []);

      // Refresh main list
      fetchData();
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error("Target not found");
      } else if (error.response?.status === 409) {
        toast.error("Duplicate trade entry");
      } else {
        toast.error(error.response?.data?.message || error.message || "Failed to record trade");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTrade = async (tradeId: string, trade: any) => {
    if (!selectedTarget) return;

    const confirmMessage = `Delete this ${trade.trade_type} trade?\n\nAmount: ${formatCurrency(trade.amount)}\nSymbol: ${trade.symbol || 'N/A'}\nTime: ${format(new Date(trade.trade_time), "HH:mm")}\n\nThis will update your daily statistics.`;

    if (!window.confirm(confirmMessage)) return;

    try {
      await tradingActivityService.delete(Number(tradeId));
      toast.success("Trade deleted successfully");

      // Refresh target detail
      const updatedTarget = await dailyTargetService.getById(selectedTarget.id);
      setSelectedTarget(updatedTarget.data);

      // Refresh trades
      const tradesRes = await dailyTargetService.getTrades(selectedTarget.id);
      setTradingActivities(tradesRes.data || []);

      // Refresh main list
      fetchData();
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error("Trade not found");
      } else {
        toast.error(error.response?.data?.message || error.message || "Failed to delete trade");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      date: format(new Date(), "yyyy-MM-dd'T'00:00:00'Z'"),
      income_target: 0,
      expense_limit: 0,
      savings_target: 0,
      notes: "",
    });
  };

  const resetTradeForm = () => {
    setTradeFormData({
      trade_type: "win",
      amount: 0,
      pips: 0,
      lot_size: 0,
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

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "text-green-600";
    if (progress >= 75) return "text-blue-600";
    if (progress >= 50) return "text-yellow-600";
    return "text-red-600";
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
            Manage your daily trading goals and track performance
          </p>
        </div>

        {/* Create Target Dialog */}
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
                    onChange={(e) => setFormData({ ...formData, income_target: parseFloat(e.target.value) || 0 })}
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
                    onChange={(e) => setFormData({ ...formData, expense_limit: parseFloat(e.target.value) || 0 })}
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
                    onChange={(e) => setFormData({ ...formData, savings_target: parseFloat(e.target.value) || 0 })}
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
      </div>

      {/* Monthly Summary */}
      {monthSummary && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <IconChartLine className="w-5 h-5 text-primary" />
              <div>
                <CardTitle className="text-xl">
                  Monthly Trading Performance
                </CardTitle>
                <CardDescription className="mt-1">
                  {monthSummary.total_days} trading days
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Profit Targets Hit */}
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

              {/* Days Within Loss Limit */}
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

              {/* Net Profit/Loss */}
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

              {/* Savings Achieved */}
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
          </CardContent>
        </Card>
      )}

      {/* Trading Targets List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Trading History</CardTitle>
          <CardDescription>Click on a target to view details and record trades</CardDescription>
        </CardHeader>
        <CardContent>
          {targets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No trading targets yet</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                Create First Target
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {targets.map((target) => (
                <div
                  key={target.id}
                  className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-base">{formatDate(target.date)}</span>
                        {target.is_completed && (
                          <Badge
                            variant={target.actual_income >= target.income_target ? "default" : "destructive"}
                          >
                            {target.actual_income >= target.income_target ? (
                              <><IconCheck className="w-3.5 h-3.5 mr-1" />Target Reached</>
                            ) : (
                              <><IconX className="w-3.5 h-3.5 mr-1" />Stop Loss Hit</>
                            )}
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Target:</span>{" "}
                          <span className="font-medium text-green-600">{formatCurrency(target.income_target)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Actual:</span>{" "}
                          <span className={`font-medium ${target.actual_income > 0 ? 'text-green-600' : ''}`}>
                            {formatCurrency(target.actual_income || 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Trades:</span>{" "}
                          <span className="font-medium">{target.total_trades || 0}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Win Rate:</span>{" "}
                          <span className={`font-medium ${
                            (target.win_rate || 0) >= 50 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {(target.win_rate || 0).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDetail(target)}
                        className="gap-2"
                      >
                        <IconEye className="w-4 h-4" />
                        View
                      </Button>
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet (Drawer from Right) - Enhanced Design */}
      <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[900px] p-0 border-l-2 !overflow-hidden">
          {selectedTarget && (
            <div className="flex flex-col h-full">
              {/* Gradient Header with Animation - STICKY */}
              <div className="sticky top-0 z-50 border-b overflow-hidden bg-background shadow-md">
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-gradient-xy"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>

                {/* Content */}
                <SheetHeader className="relative z-20 px-6 py-6">
                  <SheetTitle className="flex items-center gap-3 text-2xl font-bold mb-2">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20">
                      <IconChartCandle className="w-6 h-6 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {formatDate(selectedTarget.date)}
                    </span>
                    {selectedTarget.is_completed && (
                      <Badge
                        variant={selectedTarget.actual_income >= selectedTarget.income_target ? "default" : "destructive"}
                        className="animate-pulse shadow-lg"
                      >
                        {selectedTarget.actual_income >= selectedTarget.income_target ? "🎯 Target Reached" : "🛑 Stop Loss Hit"}
                      </Badge>
                    )}
                  </SheetTitle>
                  <SheetDescription className="text-base">
                    View detailed statistics and manage your trades
                  </SheetDescription>
                </SheetHeader>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 bg-gradient-to-b from-transparent to-muted/20">

              <Tabs defaultValue="stats" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl border shadow-sm">
                  <TabsTrigger
                    value="stats"
                    className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
                  >
                    📊 Statistics
                  </TabsTrigger>
                  <TabsTrigger
                    value="trades"
                    className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
                  >
                    💰 Trades ({tradingActivities.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="stats" className="space-y-6 mt-6">
                  {/* Stats Grid - Enhanced with Hover Effects */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="relative overflow-hidden group hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 hover:border-blue-500/50">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <CardHeader className="pb-3 relative z-10">
                        <CardDescription className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground">
                          <div className="p-1 rounded-md bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                            <IconChartLine className="w-3.5 h-3.5 text-blue-600" />
                          </div>
                          Total Trades
                        </CardDescription>
                        <CardTitle className="text-4xl font-black bg-gradient-to-br from-blue-600 to-blue-400 bg-clip-text text-transparent">
                          {selectedTarget.total_trades || 0}
                        </CardTitle>
                      </CardHeader>
                    </Card>

                    <Card className="relative overflow-hidden group hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 hover:border-green-500/50">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <CardHeader className="pb-3 relative z-10">
                        <CardDescription className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground">
                          <div className="p-1 rounded-md bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                            <IconTrendingUp className="w-3.5 h-3.5 text-green-600" />
                          </div>
                          Win Rate
                        </CardDescription>
                        <CardTitle className={`text-4xl font-black ${
                          (selectedTarget.win_rate || 0) >= 50
                            ? 'bg-gradient-to-br from-green-600 to-green-400 bg-clip-text text-transparent'
                            : 'bg-gradient-to-br from-red-600 to-red-400 bg-clip-text text-transparent'
                        }`}>
                          {(selectedTarget.win_rate || 0).toFixed(1)}%
                        </CardTitle>
                      </CardHeader>
                    </Card>

                    <Card className="relative overflow-hidden group hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 hover:border-green-500/50">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <CardHeader className="pb-3 relative z-10">
                        <CardDescription className="text-xs font-semibold flex items-center gap-1.5 text-green-600">
                          <div className="p-1 rounded-md bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                            <IconCheck className="w-3.5 h-3.5" />
                          </div>
                          Wins
                        </CardDescription>
                        <CardTitle className="text-4xl font-black bg-gradient-to-br from-green-600 to-green-400 bg-clip-text text-transparent">
                          {selectedTarget.total_wins || 0}
                        </CardTitle>
                      </CardHeader>
                    </Card>

                    <Card className="relative overflow-hidden group hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 hover:border-red-500/50">
                      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <CardHeader className="pb-3 relative z-10">
                        <CardDescription className="text-xs font-semibold flex items-center gap-1.5 text-red-600">
                          <div className="p-1 rounded-md bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                            <IconX className="w-3.5 h-3.5" />
                          </div>
                          Losses
                        </CardDescription>
                        <CardTitle className="text-4xl font-black bg-gradient-to-br from-red-600 to-red-400 bg-clip-text text-transparent">
                          {selectedTarget.total_losses || 0}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  </div>

                  {/* Progress Cards - Enhanced with Glow Effects */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Profit Progress */}
                    <Card className="relative overflow-hidden border-2 hover:border-green-500/50 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300 group">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <CardHeader className="pb-5 relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/20 group-hover:shadow-green-500/40 transition-shadow">
                              <IconTrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Profit Target</CardTitle>
                              <CardDescription className="text-xs mt-0.5">Daily trading goal</CardDescription>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={`font-bold text-base px-3 py-1 shadow-sm ${
                              (selectedTarget.income_progress || 0) >= 100 ? 'text-green-600 border-green-600 bg-green-50 dark:bg-green-950 animate-pulse' :
                              (selectedTarget.income_progress || 0) >= 75 ? 'text-blue-600 border-blue-600 bg-blue-50 dark:bg-blue-950' :
                              (selectedTarget.income_progress || 0) >= 50 ? 'text-yellow-600 border-yellow-600 bg-yellow-50 dark:bg-yellow-950' :
                              'text-red-600 border-red-600 bg-red-50 dark:bg-red-950'
                            }`}
                          >
                            {selectedTarget.income_progress?.toFixed(0)}%
                          </Badge>
                        </div>

                        {/* Enhanced Progress Bar with Glow */}
                        <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden shadow-inner">
                          <div
                            className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500 shadow-lg shadow-green-500/50"
                            style={{ width: `${Math.min(selectedTarget.income_progress || 0, 100)}%` }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                          </div>
                        </div>

                        <div className="mt-5 space-y-3 text-sm">
                          <div className="flex justify-between items-center p-2 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/50">
                            <span className="text-muted-foreground font-medium">Actual</span>
                            <span className="font-bold text-lg text-green-600">
                              {formatCurrency(selectedTarget.actual_income || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <span className="text-muted-foreground">Remaining</span>
                            <span className="font-semibold">
                              {formatCurrency(selectedTarget.remaining_income || selectedTarget.income_target)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-3 border-t-2 border-dashed">
                            <span className="font-bold text-muted-foreground">Target</span>
                            <span className="font-bold text-lg bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                              {formatCurrency(selectedTarget.income_target)}
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>

                    {/* Loss Limit */}
                    <Card className="relative overflow-hidden border-2 hover:border-red-500/50 hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300 group">
                      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <CardHeader className="pb-5 relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/20 group-hover:shadow-red-500/40 transition-shadow">
                              <IconTrendingDown className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-lg font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">Loss Limit</CardTitle>
                              <CardDescription className="text-xs mt-0.5">Stop loss threshold</CardDescription>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={`font-bold text-base px-3 py-1 shadow-sm ${
                              (selectedTarget.expense_progress || 0) >= 90 ? 'text-red-600 border-red-600 bg-red-50 dark:bg-red-950 animate-pulse' :
                              (selectedTarget.expense_progress || 0) >= 70 ? 'text-orange-600 border-orange-600 bg-orange-50 dark:bg-orange-950' :
                              (selectedTarget.expense_progress || 0) >= 50 ? 'text-yellow-600 border-yellow-600 bg-yellow-50 dark:bg-yellow-950' :
                              'text-green-600 border-green-600 bg-green-50 dark:bg-green-950'
                            }`}
                          >
                            {selectedTarget.expense_progress?.toFixed(0)}%
                          </Badge>
                        </div>

                        {/* Enhanced Progress Bar with Glow */}
                        <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden shadow-inner">
                          <div
                            className={`absolute inset-0 rounded-full transition-all duration-500 ${
                              (selectedTarget.expense_progress || 0) >= 90
                                ? 'bg-gradient-to-r from-red-600 to-rose-600 shadow-lg shadow-red-500/50 animate-pulse'
                                : 'bg-gradient-to-r from-red-500 to-rose-500 shadow-lg shadow-red-500/30'
                            }`}
                            style={{ width: `${Math.min(selectedTarget.expense_progress || 0, 100)}%` }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                          </div>
                        </div>

                        <div className="mt-5 space-y-3 text-sm">
                          <div className="flex justify-between items-center p-2 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800/50">
                            <span className="text-muted-foreground font-medium">Total Loss</span>
                            <span className="font-bold text-lg text-red-600">
                              {formatCurrency(selectedTarget.actual_expense || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <span className="text-muted-foreground">Remaining</span>
                            <span className="font-semibold">
                              {formatCurrency(selectedTarget.remaining_expense || selectedTarget.expense_limit)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-3 border-t-2 border-dashed">
                            <span className="font-bold text-muted-foreground">Limit</span>
                            <span className="font-bold text-lg bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                              {formatCurrency(selectedTarget.expense_limit)}
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </div>

                  {/* Notes - Enhanced */}
                  {selectedTarget.notes && (
                    <Card className="relative overflow-hidden border-2 border-blue-500/20 hover:border-blue-500/50 hover:shadow-lg transition-all duration-300 group">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <CardHeader className="relative z-10">
                        <CardTitle className="text-base font-bold flex items-center gap-2 mb-3">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-md">
                            <IconEdit className="w-4 h-4 text-white" />
                          </div>
                          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Trading Plan & Notes
                          </span>
                        </CardTitle>
                        <CardDescription className="text-sm leading-relaxed p-4 rounded-lg bg-muted/30 border border-dashed">
                          {selectedTarget.notes}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="trades" className="space-y-6 mt-6">
                  <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-2 border-blue-200/50 dark:border-blue-800/50">
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">Total Recorded Trades</p>
                      <p className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {tradingActivities.length} trade{tradingActivities.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Dialog open={isTradeDialogOpen} onOpenChange={setIsTradeDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          size="lg"
                          disabled={selectedTarget.is_completed}
                          className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 font-semibold"
                        >
                          <IconPlus className="w-5 h-5" />
                          Record Trade
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Record New Trade</DialogTitle>
                          <DialogDescription>
                            Add your trading activity (win or loss)
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmitTrade}>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Trade Type *</Label>
                              <div className="flex gap-4">
                                <Button
                                  type="button"
                                  variant={tradeFormData.trade_type === "win" ? "default" : "outline"}
                                  className="flex-1"
                                  onClick={() => setTradeFormData({ ...tradeFormData, trade_type: "win" })}
                                >
                                  <IconTrendingUp className="w-4 h-4 mr-2" />
                                  Win
                                </Button>
                                <Button
                                  type="button"
                                  variant={tradeFormData.trade_type === "loss" ? "destructive" : "outline"}
                                  className="flex-1"
                                  onClick={() => setTradeFormData({ ...tradeFormData, trade_type: "loss" })}
                                >
                                  <IconTrendingDown className="w-4 h-4 mr-2" />
                                  Loss
                                </Button>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="amount">Amount (IDR) *</Label>
                              <Input
                                id="amount"
                                type="number"
                                min="0"
                                step="0.01"
                                value={tradeFormData.amount}
                                onChange={(e) => setTradeFormData({ ...tradeFormData, amount: parseFloat(e.target.value) || 0 })}
                                required
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="pips">Pips</Label>
                                <Input
                                  id="pips"
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  value={tradeFormData.pips}
                                  onChange={(e) => setTradeFormData({ ...tradeFormData, pips: parseFloat(e.target.value) || 0 })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="lot_size">Lot Size</Label>
                                <Input
                                  id="lot_size"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={tradeFormData.lot_size}
                                  onChange={(e) => setTradeFormData({ ...tradeFormData, lot_size: parseFloat(e.target.value) || 0 })}
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="symbol">Symbol/Pair</Label>
                              <Input
                                id="symbol"
                                type="text"
                                value={tradeFormData.symbol}
                                onChange={(e) => setTradeFormData({ ...tradeFormData, symbol: e.target.value })}
                                placeholder="e.g. EUR/USD"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="trade_description">Description</Label>
                              <Textarea
                                id="trade_description"
                                value={tradeFormData.description}
                                onChange={(e) => setTradeFormData({ ...tradeFormData, description: e.target.value })}
                                placeholder="Trade notes, strategy used, market conditions..."
                                rows={3}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="trade_time">Trade Time</Label>
                              <Input
                                id="trade_time"
                                type="datetime-local"
                                value={tradeFormData.trade_time ? format(new Date(tradeFormData.trade_time), "yyyy-MM-dd'T'HH:mm") : ""}
                                onChange={(e) => setTradeFormData({ ...tradeFormData, trade_time: new Date(e.target.value).toISOString() })}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsTradeDialogOpen(false)}
                              disabled={submitting}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={submitting}>
                              {submitting ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Recording...
                                </>
                              ) : (
                                "Record Trade"
                              )}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {tradingActivities.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No trades recorded yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tradingActivities.map((trade) => (
                        <div
                          key={trade.id}
                          className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-3">
                                <Badge
                                  variant={trade.trade_type === "win" ? "default" : "destructive"}
                                >
                                  {trade.trade_type === "win" ? (
                                    <><IconTrendingUp className="w-3.5 h-3.5 mr-1" />Win</>
                                  ) : (
                                    <><IconTrendingDown className="w-3.5 h-3.5 mr-1" />Loss</>
                                  )}
                                </Badge>
                                <span className={`text-xl font-bold ${trade.trade_type === "win" ? "text-green-600" : "text-red-600"}`}>
                                  {formatCurrency(trade.amount)}
                                </span>
                                {trade.symbol && (
                                  <Badge variant="outline" className="text-xs font-mono">
                                    {trade.symbol}
                                  </Badge>
                                )}
                              </div>

                              <div className="flex gap-6 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Time:</span>{" "}
                                  <span className="font-medium">
                                    {format(new Date(trade.trade_time), "HH:mm")}
                                  </span>
                                </div>
                                {trade.pips && (
                                  <div>
                                    <span className="text-muted-foreground">Pips:</span>{" "}
                                    <span className="font-medium">{trade.pips}</span>
                                  </div>
                                )}
                                {trade.lot_size && (
                                  <div>
                                    <span className="text-muted-foreground">Lot:</span>{" "}
                                    <span className="font-medium">{trade.lot_size}</span>
                                  </div>
                                )}
                              </div>

                              {trade.description && (
                                <div className="p-2.5 rounded-md bg-muted/50 border text-sm text-muted-foreground">
                                  {trade.description}
                                </div>
                              )}
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTrade(trade.id, trade)}
                              disabled={selectedTarget.is_completed}
                              className="hover:bg-destructive/10 hover:text-destructive"
                            >
                              <IconTrash className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
