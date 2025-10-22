"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IconChartLine, IconPlus, IconEdit, IconTrash, IconPlayerPlay, IconCheck } from "@tabler/icons-react";
import { backtestStrategyService, BacktestStrategy } from "@/lib/api/finance";
import { toast } from "sonner";
import { format } from "date-fns";

export default function BacktestPage() {
  const [strategies, setStrategies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<any>(null);
  const [viewingResult, setViewingResult] = useState<any>(null);

  const [formData, setFormData] = useState<BacktestStrategy>({
    name: "",
    description: "",
    strategy_type: "investment",
    initial_amount: 0,
    monthly_contribution: 0,
    expected_return: 8.0,
    duration: 12,
    start_date: format(new Date(), "yyyy-MM-dd'T'00:00:00'Z'"),
  });

  useEffect(() => {
    fetchStrategies();
  }, []);

  const fetchStrategies = async () => {
    try {
      setLoading(true);
      const response = await backtestStrategyService.getAll({ page: 1, page_size: 50 });
      setStrategies(response.data.strategies || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch strategies");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStrategy) {
        await backtestStrategyService.update(editingStrategy.id, formData);
        toast.success("Strategy updated successfully");
      } else {
        await backtestStrategyService.create(formData);
        toast.success("Strategy created successfully");
      }
      setIsDialogOpen(false);
      resetForm();
      fetchStrategies();
    } catch (error: any) {
      toast.error(error.message || "Failed to save strategy");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this strategy?")) return;
    try {
      await backtestStrategyService.delete(id);
      toast.success("Strategy deleted successfully");
      fetchStrategies();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete strategy");
    }
  };

  const handleRun = async (id: number) => {
    try {
      await backtestStrategyService.run(id);
      toast.success("Backtest executed successfully");
      fetchStrategies();
    } catch (error: any) {
      toast.error(error.message || "Failed to run backtest");
    }
  };

  const handleActivate = async (id: number) => {
    try {
      await backtestStrategyService.activate(id);
      toast.success("Strategy activated successfully");
      fetchStrategies();
    } catch (error: any) {
      toast.error(error.message || "Failed to activate strategy");
    }
  };

  const handleViewResult = async (id: number) => {
    try {
      const response = await backtestStrategyService.getResult(id);
      setViewingResult(response.data);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch result");
    }
  };

  const handleEdit = (strategy: any) => {
    setEditingStrategy(strategy);
    setFormData({
      name: strategy.name,
      description: strategy.description || "",
      strategy_type: strategy.strategy_type,
      initial_amount: strategy.initial_amount,
      monthly_contribution: strategy.monthly_contribution,
      expected_return: strategy.expected_return,
      duration: strategy.duration,
      start_date: strategy.start_date,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingStrategy(null);
    setFormData({
      name: "",
      description: "",
      strategy_type: "investment",
      initial_amount: 0,
      monthly_contribution: 0,
      expected_return: 8.0,
      duration: 12,
      start_date: format(new Date(), "yyyy-MM-dd'T'00:00:00'Z'"),
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  const getStatusColor = (status: string) => {
    if (status === "active") return "default";
    if (status === "completed") return "secondary";
    if (status === "draft") return "outline";
    return "destructive";
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Backtest Strategies
          </h1>
          <p className="text-muted-foreground mt-2">Simulate and analyze investment strategies</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="w-fit gap-2"><IconPlus className="w-4 h-4" />Create Strategy</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingStrategy ? "Edit Strategy" : "Create Strategy"}</DialogTitle>
              <DialogDescription>Design an investment or savings strategy to backtest</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Strategy Name *</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="strategy_type">Type *</Label>
                  <Select value={formData.strategy_type} onValueChange={(value: any) => setFormData({ ...formData, strategy_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="savings">Savings</SelectItem>
                      <SelectItem value="investment">Investment</SelectItem>
                      <SelectItem value="expense_reduction">Expense Reduction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="initial_amount">Initial Amount *</Label>
                    <Input id="initial_amount" type="number" min="0" value={formData.initial_amount} onChange={(e) => setFormData({ ...formData, initial_amount: parseFloat(e.target.value) || 0 })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthly_contribution">Monthly *</Label>
                    <Input id="monthly_contribution" type="number" min="0" value={formData.monthly_contribution} onChange={(e) => setFormData({ ...formData, monthly_contribution: parseFloat(e.target.value) || 0 })} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expected_return">Expected Return (%) *</Label>
                    <Input id="expected_return" type="number" step="0.1" value={formData.expected_return} onChange={(e) => setFormData({ ...formData, expected_return: parseFloat(e.target.value) || 0 })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (months) *</Label>
                    <Input id="duration" type="number" min="1" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 1 })} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input id="start_date" type="date" value={format(new Date(formData.start_date), "yyyy-MM-dd")} onChange={(e) => setFormData({ ...formData, start_date: new Date(e.target.value).toISOString() })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit">{editingStrategy ? "Update" : "Create"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Strategies</CardTitle>
          <CardDescription>Backtest results and projections</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : strategies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No strategies yet</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setIsDialogOpen(true)}>Create First Strategy</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {strategies.map((strategy) => (
                <div key={strategy.id} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-lg">{strategy.name}</h4>
                        <Badge variant={getStatusColor(strategy.status)}>{strategy.status}</Badge>
                        <Badge variant="outline">{strategy.strategy_type}</Badge>
                      </div>
                      {strategy.description && <p className="text-sm text-muted-foreground">{strategy.description}</p>}
                    </div>
                    <div className="flex gap-2">
                      {strategy.status === "draft" && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => handleRun(strategy.id)} title="Run Backtest"><IconPlayerPlay className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleActivate(strategy.id)} title="Activate"><IconCheck className="w-4 h-4" /></Button>
                        </>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(strategy)}><IconEdit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(strategy.id)}><IconTrash className="w-4 h-4 text-red-500" /></Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Initial</div>
                      <div className="font-medium">{formatCurrency(strategy.initial_amount)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Monthly</div>
                      <div className="font-medium">{formatCurrency(strategy.monthly_contribution)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Return</div>
                      <div className="font-medium">{strategy.expected_return}% p.a.</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Duration</div>
                      <div className="font-medium">{strategy.duration} months</div>
                    </div>
                  </div>
                  {strategy.projected_amount && (
                    <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Projected Final Amount</span>
                        <span className="text-lg font-bold text-indigo-600">{formatCurrency(strategy.projected_amount)}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Result Dialog */}
      {viewingResult && (
        <Dialog open={!!viewingResult} onOpenChange={() => setViewingResult(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Backtest Results</DialogTitle>
              <DialogDescription>Detailed calculation breakdown</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Total Contributed</div>
                  <div className="text-xl font-bold">{formatCurrency(viewingResult.total_contributed)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Returns</div>
                  <div className="text-xl font-bold text-green-600">{formatCurrency(viewingResult.total_returns)}</div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
                <div className="text-sm text-muted-foreground mb-1">Final Amount</div>
                <div className="text-3xl font-bold text-indigo-600">{formatCurrency(viewingResult.final_amount)}</div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
