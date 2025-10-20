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
import { IconTarget, IconPlus, IconEdit, IconTrash, IconTrendingUp, IconTrendingDown, IconChartLine, IconCheck, IconX, IconChartCandle } from "@tabler/icons-react";
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
  
  // Detail/View Target Dialog
  const [selectedTarget, setSelectedTarget] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
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
    setIsDetailDialogOpen(true);
    
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

    // Prevent double submission
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
      await dailyTargetService.delete(id);
      toast.success("Target deleted successfully");
      
      // Optimistic update
      setTargets(targets.filter(t => t.id !== id));
      
      // Refresh to be sure
      fetchData();
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error("Target not found");
      } else {
        toast.error(error.response?.data?.message || error.message || "Failed to delete target");
      }
      // Refresh on error to show correct state
      fetchData();
    }
  };

  const handleSubmitTrade = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting || !selectedTarget) return;

    try {
      setSubmitting(true);
      await tradingActivityService.create(selectedTarget.id, tradeFormData);
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
      await tradingActivityService.delete(selectedTarget.id, tradeId);
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
      {/* Clean Header */}
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
                Set your profit target (Income) and loss limit/stop loss (Expense) for the day
              </DialogDescription>
            </DialogHeader>

      return;
    }

    try {
      await dailyTargetService.delete(id);
      toast.success(`Target for ${formattedDate} deleted successfully`);

      // Update local state immediately
      setTargets(prev => prev.filter(t => t.id !== id));
      if (todayTarget?.id === id) {
        setTodayTarget(null);
        setTradingActivities([]);
      }
    } catch (error: any) {
      console.error("Error deleting target:", error);

      // Handle specific error types
      if (error.message?.includes("not found")) {
        toast.error("Target not found. It may have already been deleted.");
        fetchData(); // Refresh to sync with server
      } else if (error.message?.includes("unauthorized") || error.message?.includes("forbidden")) {
        toast.error("You don't have permission to delete this target.");
      } else {
        toast.error(error.message || "Failed to delete target. Please try again.");
      }
    }
  };

  const handleSubmitTrade = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!todayTarget) {
      toast.error("No target for today. Please create a target first.");
      return;
    }

    // Prevent double submission
    if (submitting) return;

    try {
      setSubmitting(true);

      await dailyTargetService.addTrade(todayTarget.id, tradeFormData);
      toast.success(`${tradeFormData.trade_type === "win" ? "Winning" : "Losing"} trade recorded successfully`);

      setIsTradeDialogOpen(false);
      resetTradeForm();
      fetchData(); // Refresh to get updated stats
    } catch (error: any) {
      console.error("Error recording trade:", error);

      // Handle specific error types
      if (error.message?.includes("not found")) {
        toast.error("Target not found. Please refresh the page.");
        fetchData();
      } else if (error.message?.includes("completed")) {
        toast.error("This target is already completed. No more trades can be added.");
        fetchData();
      } else if (error.message?.includes("unauthorized") || error.message?.includes("forbidden")) {
        toast.error("You don't have permission to add trades.");
      } else {
        toast.error(error.message || "Failed to record trade. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTrade = async (tradeId: number, tradeInfo: any) => {
    const tradeType = tradeInfo.trade_type === "win" ? "Winning" : "Losing";
    const amount = formatCurrency(tradeInfo.amount);
    const symbol = tradeInfo.symbol ? ` (${tradeInfo.symbol})` : "";

    if (!confirm(`Delete this ${tradeType.toLowerCase()} trade?\n\nAmount: ${amount}${symbol}\n\nThis will recalculate your trading statistics. This action cannot be undone.`)) {
      return;
    }

    try {
      await tradingActivityService.delete(tradeId);
      toast.success("Trade deleted successfully");

      // Update local state
      setTradingActivities(prev => prev.filter(t => t.id !== tradeId));
      fetchData(); // Refresh to get updated stats
    } catch (error: any) {
      console.error("Error deleting trade:", error);

      // Handle specific error types
      if (error.message?.includes("not found")) {
        toast.error("Trade not found. It may have already been deleted.");
        fetchData();
      } else if (error.message?.includes("unauthorized") || error.message?.includes("forbidden")) {
        toast.error("You don't have permission to delete this trade.");
      } else {
        toast.error(error.message || "Failed to delete trade. Please try again.");
      }
    }
  };

  const handleEdit = (target: any) => {
    setEditingTarget(target);
    setFormData({
      date: target.date,
      income_target: target.income_target,
      expense_limit: target.expense_limit,
      savings_target: target.savings_target,
      notes: target.notes || "",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingTarget(null);
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
      trade_type: "win" as "win" | "loss",
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
      {/* Clean Header */}
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
            Track your daily trading performance and goals
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
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
              <DialogTitle>{editingTarget ? "Edit Trading Target" : "Create Trading Target"}</DialogTitle>
              <DialogDescription>
                Set your profit target (Income) and loss limit/stop loss (Expense) for the day
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
                    placeholder="e.g. 1000000 (1 juta)"
                  />
                  <p className="text-xs text-muted-foreground">Your daily profit goal</p>
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
                    placeholder="e.g. 100000 (100 ribu)"
                  />
                  <p className="text-xs text-muted-foreground">Maximum loss you can afford</p>
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
                  <p className="text-xs text-muted-foreground">Amount to save from today's profit</p>
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
                  onClick={() => setIsDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingTarget ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    editingTarget ? "Update" : "Create"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Today's Target - Clean Design */}
      {todayTarget && (
        <Card className="border-2">


          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2.5 text-xl">
                  <IconChartCandle className="w-5 h-5 text-primary" />
                  Today's Trading Performance
                </CardTitle>
                <CardDescription className="ml-7">{formatDate(todayTarget.date)}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {todayTarget.is_completed && (
                  <Badge
                    variant={todayTarget.actual_income >= todayTarget.income_target ? "default" : "destructive"}
                  >
                    {todayTarget.actual_income >= todayTarget.income_target ? (
                      <><IconCheck className="w-3.5 h-3.5 mr-1" />Target Reached</>
                    ) : (
                      <><IconX className="w-3.5 h-3.5 mr-1" />Stop Loss Hit</>
                    )}
                  </Badge>
                )}
                <Dialog open={isTradeDialogOpen} onOpenChange={(open) => {
                  setIsTradeDialogOpen(open);
                  if (!open) resetTradeForm();
                }}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      disabled={todayTarget.is_completed}
                      className="gap-2"
                    >
                      <IconPlus className="w-4 h-4" />
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
                              step="0.1"
                              value={tradeFormData.pips || ""}
                              onChange={(e) => setTradeFormData({ ...tradeFormData, pips: parseFloat(e.target.value) || 0 })}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="lot_size">Lot Size</Label>
                            <Input
                              id="lot_size"
                              type="number"
                              step="0.01"
                              value={tradeFormData.lot_size || ""}
                              onChange={(e) => setTradeFormData({ ...tradeFormData, lot_size: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="symbol">Symbol / Pair</Label>
                          <Input
                            id="symbol"
                            type="text"
                            placeholder="e.g. EURUSD, XAUUSD, BTCUSD"
                            value={tradeFormData.symbol}
                            onChange={(e) => setTradeFormData({ ...tradeFormData, symbol: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="trade_time">Trade Time *</Label>
                          <Input
                            id="trade_time"
                            type="datetime-local"
                            value={tradeFormData.trade_time ? format(new Date(tradeFormData.trade_time), "yyyy-MM-dd'T'HH:mm") : ""}
                            onChange={(e) => setTradeFormData({ ...tradeFormData, trade_time: new Date(e.target.value).toISOString() })}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description">Description / Notes</Label>
                          <Textarea
                            id="description"
                            value={tradeFormData.description}
                            onChange={(e) => setTradeFormData({ ...tradeFormData, description: e.target.value })}
                            placeholder="Trade setup, reason, strategy..."
                            rows={3}
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
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="stats" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="stats">Statistics</TabsTrigger>
                <TabsTrigger value="trades">Trades History</TabsTrigger>
              </TabsList>

              <TabsContent value="stats" className="space-y-6 mt-6">
                {/* Simple Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Total Trades */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription className="text-xs font-medium flex items-center gap-1.5">
                        <IconChartLine className="w-3.5 h-3.5" />
                        Total Trades
                      </CardDescription>
                      <CardTitle className="text-3xl font-bold">
                        {todayTarget.total_trades || 0}
                      </CardTitle>
                    </CardHeader>
                  </Card>

                  {/* Win Rate */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription className="text-xs font-medium flex items-center gap-1.5">
                        <IconTrendingUp className="w-3.5 h-3.5" />
                        Win Rate
                      </CardDescription>
                      <CardTitle className={`text-3xl font-bold ${
                        (todayTarget.win_rate || 0) >= 50 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(todayTarget.win_rate || 0).toFixed(1)}%
                      </CardTitle>
                    </CardHeader>
                  </Card>

                  {/* Wins */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription className="text-xs font-medium flex items-center gap-1.5 text-green-600">
                        <IconCheck className="w-3.5 h-3.5" />
                        Wins
                      </CardDescription>
                      <CardTitle className="text-3xl font-bold text-green-600">
                        {todayTarget.total_wins || 0}
                      </CardTitle>
                    </CardHeader>
                  </Card>

                  {/* Losses */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription className="text-xs font-medium flex items-center gap-1.5 text-red-600">
                        <IconX className="w-3.5 h-3.5" />
                        Losses
                      </CardDescription>
                      <CardTitle className="text-3xl font-bold text-red-600">
                        {todayTarget.total_losses || 0}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </div>

                {/* Progress Cards - Clean Design */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Profit Progress */}
                  <Card>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-green-500/10">
                            <IconTrendingUp className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base font-semibold">Profit Target</CardTitle>
                            <CardDescription className="text-xs">Daily goal</CardDescription>
                          </div>
                        </div>
                        <Badge variant="outline" className={`font-semibold ${
                          (todayTarget.income_progress || 0) >= 100 ? 'text-green-600 border-green-600' :
                          (todayTarget.income_progress || 0) >= 75 ? 'text-blue-600 border-blue-600' :
                          (todayTarget.income_progress || 0) >= 50 ? 'text-yellow-600 border-yellow-600' :
                          'text-red-600 border-red-600'
                        }`}>
                          {todayTarget.income_progress?.toFixed(0)}%
                        </Badge>
                      </div>

                      {/* Simple Progress Bar */}
                      <div className="relative w-full h-2.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="absolute inset-0 bg-green-600 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(todayTarget.income_progress || 0, 100)}%` }}
                        />
                      </div>

                      <div className="mt-4 space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Actual</span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(todayTarget.actual_income || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Remaining</span>
                          <span className="font-medium">
                            {formatCurrency(todayTarget.remaining_income || todayTarget.income_target)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="font-medium">Target</span>
                          <span className="font-semibold">
                            {formatCurrency(todayTarget.income_target)}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Loss Limit */}
                  <Card>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-red-500/10">
                            <IconTrendingDown className="w-4 h-4 text-red-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base font-semibold">Loss Limit</CardTitle>
                            <CardDescription className="text-xs">Stop loss</CardDescription>
                          </div>
                        </div>
                        <Badge variant="outline" className={`font-semibold ${
                          (todayTarget.expense_progress || 0) >= 90 ? 'text-red-600 border-red-600 animate-pulse' :
                          (todayTarget.expense_progress || 0) >= 70 ? 'text-orange-600 border-orange-600' :
                          (todayTarget.expense_progress || 0) >= 50 ? 'text-yellow-600 border-yellow-600' :
                          'text-green-600 border-green-600'
                        }`}>
                          {todayTarget.expense_progress?.toFixed(0)}%
                        </Badge>
                      </div>

                      {/* Simple Progress Bar */}
                      <div className="relative w-full h-2.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="absolute inset-0 bg-red-600 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(todayTarget.expense_progress || 0, 100)}%` }}
                        />
                      </div>

                      <div className="mt-4 space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Total Loss</span>
                          <span className="font-semibold text-red-600">
                            {formatCurrency(todayTarget.actual_expense || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Remaining</span>
                          <span className="font-medium">
                            {formatCurrency(todayTarget.remaining_expense || todayTarget.expense_limit)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="font-medium">Limit</span>
                          <span className="font-semibold">
                            {formatCurrency(todayTarget.expense_limit)}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </div>

                {/* Trading Notes */}
                {todayTarget.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <IconEdit className="w-4 h-4" />
                        Trading Plan & Notes
                      </CardTitle>
                      <CardDescription className="text-sm leading-relaxed mt-2">
                        {todayTarget.notes}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="trades" className="mt-4">
                {tradingActivities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <IconChartLine className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No trades recorded yet</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => setIsTradeDialogOpen(true)}
                      disabled={todayTarget.is_completed}
                    >
                      Record First Trade
                    </Button>
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
                            disabled={todayTarget.is_completed}
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
          </CardContent>
        </Card>
      )}

      {/* Monthly Summary - Clean Design */}
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

      {/* All Targets - Trading History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Trading History</CardTitle>
          <CardDescription>Your daily trading targets</CardDescription>
        </CardHeader>
        <CardContent>
          {targets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No trading targets set for this month</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setIsDialogOpen(true)}>
                Set First Trading Target
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {targets.map((target) => (
                <div key={target.id} className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <h4 className="font-semibold">{formatDate(target.date)}</h4>
                        {target.notes && <p className="text-sm text-muted-foreground">{target.notes}</p>}
                      </div>
                      {target.is_completed && (
                        <Badge variant={target.actual_income >= target.income_target ? "default" : "destructive"}>
                          {target.actual_income >= target.income_target ? "✓ Target" : "✗ Stop Loss"}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(target)}>
                        <IconEdit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(target.id, target.date)}>
                        <IconTrash className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  {/* Trading Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mb-3">
                    <div>
                      <div className="text-muted-foreground text-xs">Total Trades</div>
                      <div className="font-medium">{target.total_trades || 0}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Win Rate</div>
                      <div className={`font-medium ${(target.win_rate || 0) >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                        {(target.win_rate || 0).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Wins / Losses</div>
                      <div className="font-medium">
                        <span className="text-green-600">{target.winning_trades || 0}</span> / <span className="text-red-600">{target.losing_trades || 0}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Profit</div>
                      <div className="font-medium text-green-600">{formatCurrency(target.actual_income || 0)}</div>
                      <div className="text-xs text-muted-foreground">Target: {formatCurrency(target.income_target)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Loss</div>
                      <div className="font-medium text-red-600">{formatCurrency(target.actual_expense || 0)}</div>
                      <div className="text-xs text-muted-foreground">Limit: {formatCurrency(target.expense_limit)}</div>
                    </div>
                  </div>

                  {/* Progress Bars */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Profit Progress</span>
                        <span className={getProgressColor(target.income_progress || 0)}>
                          {target.income_progress?.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(target.income_progress || 0, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Loss Limit</span>
                        <span className={getProgressColor(100 - (target.expense_progress || 0))}>
                          {target.expense_progress?.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(target.expense_progress || 0, 100)}%` }}
                        ></div>
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
  );
}
