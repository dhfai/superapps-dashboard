"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IconChartPie, IconPlus, IconEdit, IconTrash, IconAlertTriangle } from "@tabler/icons-react";
import { budgetService, Budget } from "@/lib/api/finance";
import { toast } from "sonner";
import { format } from "date-fns";

const BUDGET_CATEGORIES = ["Food & Dining", "Transportation", "Shopping", "Bills", "Entertainment", "Healthcare", "Education", "Housing", "Utilities", "Insurance", "Other"];

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);

  const [formData, setFormData] = useState<Budget>({
    category: "",
    amount: 0,
    period: "monthly",
    start_date: format(new Date(), "yyyy-MM-dd'T'00:00:00'Z'"),
    end_date: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), "yyyy-MM-dd'T'00:00:00'Z'"),
    is_recurring: true,
  });

  useEffect(() => {
    fetchBudgets();
    fetchSummary();
    fetchAlerts();
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await budgetService.getAll({ page: 1, page_size: 50 });
      setBudgets(response.data.budgets || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch budgets");
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await budgetService.getSummary();
      setSummary(response.data);
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await budgetService.getAlerts(80);
      // Handle different response structures
      if (response.data && Array.isArray(response.data)) {
        setAlerts(response.data);
      } else if (Array.isArray(response)) {
        setAlerts(response);
      } else {
        setAlerts([]);
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
      setAlerts([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBudget) {
        await budgetService.update(editingBudget.id, formData);
        toast.success("Budget updated successfully");
      } else {
        await budgetService.create(formData);
        toast.success("Budget created successfully");
      }
      setIsDialogOpen(false);
      resetForm();
      fetchBudgets();
      fetchSummary();
      fetchAlerts();
    } catch (error: any) {
      toast.error(error.message || "Failed to save budget");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this budget?")) return;
    try {
      await budgetService.delete(id);
      toast.success("Budget deleted successfully");
      fetchBudgets();
      fetchSummary();
      fetchAlerts();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete budget");
    }
  };

  const handleEdit = (budget: any) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category,
      amount: budget.amount,
      period: budget.period,
      start_date: budget.start_date,
      end_date: budget.end_date,
      is_recurring: budget.is_recurring,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingBudget(null);
    setFormData({
      category: "",
      amount: 0,
      period: "monthly",
      start_date: format(new Date(), "yyyy-MM-dd'T'00:00:00'Z'"),
      end_date: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), "yyyy-MM-dd'T'00:00:00'Z'"),
      is_recurring: true,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  const getStatusColor = (status: string) => {
    if (status === "good") return "default";
    if (status === "warning") return "secondary";
    if (status === "critical") return "destructive";
    return "destructive";
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Budget Management
          </h1>
          <p className="text-muted-foreground mt-2">Set and track spending limits by category</p>
        </div>

        {alerts.length > 0 && (
          <Card className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <IconAlertTriangle className="w-6 h-6 text-orange-500" />
                <div className="flex-1">
                  <p className="font-semibold text-orange-900 dark:text-orange-100">Budget Alerts</p>
                  <p className="text-sm text-orange-700 dark:text-orange-300">{alerts.length} budget(s) exceeding threshold</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Allocated</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summary.total_allocated)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.total_spent)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Remaining</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.total_remaining)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Over Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{summary.over_budget_count || 0}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="w-fit gap-2"><IconPlus className="w-4 h-4" />Add Budget</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingBudget ? "Edit Budget" : "Create Budget"}</DialogTitle>
              <DialogDescription>Set spending limits for categories</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUDGET_CATEGORIES.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Budget Amount (IDR) *</Label>
                  <Input id="amount" type="number" min="0" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="period">Period *</Label>
                  <Select value={formData.period} onValueChange={(value: any) => setFormData({ ...formData, period: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date *</Label>
                    <Input id="start_date" type="date" value={format(new Date(formData.start_date), "yyyy-MM-dd")} onChange={(e) => setFormData({ ...formData, start_date: new Date(e.target.value).toISOString() })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date *</Label>
                    <Input id="end_date" type="date" value={format(new Date(formData.end_date), "yyyy-MM-dd")} onChange={(e) => setFormData({ ...formData, end_date: new Date(e.target.value).toISOString() })} required />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit">{editingBudget ? "Update" : "Create"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Budgets</CardTitle>
          <CardDescription>Track spending by category</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : budgets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No budgets set</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setIsDialogOpen(true)}>Create First Budget</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {budgets.map((budget) => (
                <div key={budget.id} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-lg">{budget.category}</h4>
                        <Badge variant="outline">{budget.period}</Badge>
                        {budget.status && <Badge variant={getStatusColor(budget.status)}>{budget.status}</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(budget)}><IconEdit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(budget.id)}><IconTrash className="w-4 h-4 text-red-500" /></Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Spending</span>
                      <span className="font-medium">{budget.percentage?.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          (budget.percentage || 0) >= 100 ? 'bg-red-500' :
                          (budget.percentage || 0) >= 90 ? 'bg-orange-500' :
                          (budget.percentage || 0) >= 75 ? 'bg-yellow-500' :
                          'bg-gradient-to-r from-blue-500 to-cyan-500'
                        }`}
                        style={{ width: `${Math.min(budget.percentage || 0, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatCurrency(budget.spent || 0)} / {formatCurrency(budget.amount)}</span>
                      <span>{formatCurrency(budget.remaining || 0)} remaining</span>
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
