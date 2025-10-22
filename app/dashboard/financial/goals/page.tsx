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
import { IconTarget, IconPlus, IconEdit, IconTrash, IconTrendingUp } from "@tabler/icons-react";
import { financialGoalService, FinancialGoal } from "@/lib/api/finance";
import { toast } from "sonner";
import { format } from "date-fns";

const GOAL_CATEGORIES = ["Savings", "Investment", "Debt Payment", "Emergency Fund", "Vacation", "Education", "Home", "Car", "Retirement", "Other"];

export default function GoalsPage() {
  const [goals, setGoals] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [filter, setFilter] = useState({ category: "", priority: "", is_completed: "" });

  const [formData, setFormData] = useState<FinancialGoal>({
    title: "",
    description: "",
    target_amount: 0,
    current_amount: 0,
    start_date: format(new Date(), "yyyy-MM-dd'T'00:00:00'Z'"),
    target_date: format(new Date(Date.now() + 365*24*60*60*1000), "yyyy-MM-dd'T'00:00:00'Z'"),
    category: "",
    priority: 1,
  });

  useEffect(() => {
    fetchGoals();
    fetchSummary();
  }, [filter]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const params: any = { page: 1, page_size: 50 };
      if (filter.category) params.category = filter.category;
      if (filter.priority !== "") params.priority = parseInt(filter.priority);
      if (filter.is_completed !== "") params.is_completed = filter.is_completed === "true";

      const response = await financialGoalService.getAll(params);
      setGoals(response.data.goals || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch goals");
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await financialGoalService.getSummary();
      setSummary(response.data);
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGoal) {
        await financialGoalService.update(editingGoal.id, formData);
        toast.success("Goal updated successfully");
      } else {
        await financialGoalService.create(formData);
        toast.success("Goal created successfully");
      }
      setIsDialogOpen(false);
      resetForm();
      fetchGoals();
      fetchSummary();
    } catch (error: any) {
      toast.error(error.message || "Failed to save goal");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this goal?")) return;
    try {
      await financialGoalService.delete(id);
      toast.success("Goal deleted successfully");
      fetchGoals();
      fetchSummary();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete goal");
    }
  };

  const handleAddProgress = async (id: number) => {
    const amount = prompt("Enter amount to add:");
    if (!amount) return;
    try {
      await financialGoalService.addProgress(id, parseFloat(amount));
      toast.success("Progress updated successfully");
      fetchGoals();
      fetchSummary();
    } catch (error: any) {
      toast.error(error.message || "Failed to update progress");
    }
  };

  const handleEdit = (goal: any) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || "",
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      start_date: goal.start_date,
      target_date: goal.target_date,
      category: goal.category || "",
      priority: goal.priority,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingGoal(null);
    setFormData({
      title: "",
      description: "",
      target_amount: 0,
      current_amount: 0,
      start_date: format(new Date(), "yyyy-MM-dd'T'00:00:00'Z'"),
      target_date: format(new Date(Date.now() + 365*24*60*60*1000), "yyyy-MM-dd'T'00:00:00'Z'"),
      category: "",
      priority: 1,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  const getPriorityColor = (priority: number) => {
    if (priority === 2) return "destructive";
    if (priority === 1) return "default";
    return "secondary";
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Financial Goals
          </h1>
          <p className="text-muted-foreground mt-2">Track and achieve your long-term financial objectives</p>
        </div>

        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{summary.active_goals}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{summary.completed_goals}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Target</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summary.total_target)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Overall Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{summary.overall_progress?.toFixed(1)}%</div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex gap-3 flex-wrap items-center justify-between">
          <div className="flex gap-3">
            <Select value={filter.category || "all"} onValueChange={(value) => setFilter({ ...filter, category: value === "all" ? "" : value })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {GOAL_CATEGORIES.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filter.priority || "all"} onValueChange={(value) => setFilter({ ...filter, priority: value === "all" ? "" : value })}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="2">High</SelectItem>
                <SelectItem value="1">Medium</SelectItem>
                <SelectItem value="0">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><IconPlus className="w-4 h-4" />Add Goal</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingGoal ? "Edit Goal" : "Create New Goal"}</DialogTitle>
                <DialogDescription>Set a financial goal and track your progress</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {GOAL_CATEGORIES.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="target_amount">Target Amount *</Label>
                      <Input id="target_amount" type="number" min="0" value={formData.target_amount} onChange={(e) => setFormData({ ...formData, target_amount: parseFloat(e.target.value) || 0 })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="current_amount">Current Amount *</Label>
                      <Input id="current_amount" type="number" min="0" value={formData.current_amount} onChange={(e) => setFormData({ ...formData, current_amount: parseFloat(e.target.value) || 0 })} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Start Date *</Label>
                      <Input id="start_date" type="date" value={format(new Date(formData.start_date), "yyyy-MM-dd")} onChange={(e) => setFormData({ ...formData, start_date: new Date(e.target.value).toISOString() })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="target_date">Target Date *</Label>
                      <Input id="target_date" type="date" value={format(new Date(formData.target_date), "yyyy-MM-dd")} onChange={(e) => setFormData({ ...formData, target_date: new Date(e.target.value).toISOString() })} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority *</Label>
                    <Select value={formData.priority.toString()} onValueChange={(value) => setFormData({ ...formData, priority: parseInt(value) as 0 | 1 | 2 })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">High</SelectItem>
                        <SelectItem value="1">Medium</SelectItem>
                        <SelectItem value="0">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit">{editingGoal ? "Update" : "Create"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Goals</CardTitle>
          <CardDescription>Track progress towards your financial objectives</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : goals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No goals yet</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setIsDialogOpen(true)}>Create First Goal</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map((goal) => (
                <div key={goal.id} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{goal.title}</h4>
                      <p className="text-sm text-muted-foreground">{goal.description}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant={getPriorityColor(goal.priority)}>{goal.priority_label}</Badge>
                        {goal.category && <Badge variant="outline">{goal.category}</Badge>}
                        {goal.is_completed && <Badge variant="default">Completed</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleAddProgress(goal.id)}><IconTrendingUp className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(goal)}><IconEdit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(goal.id)}><IconTrash className="w-4 h-4 text-red-500" /></Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-medium">{goal.progress?.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all" style={{ width: `${Math.min(goal.progress || 0, 100)}%` }}></div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}</span>
                      <span>{goal.days_remaining} days left · {formatCurrency(goal.required_per_day || 0)}/day</span>
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
