import { tokenService } from './auth';

const API_BASE_URL = 'http://localhost:8080/api/v1/finance';

// Helper function to make authenticated requests
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = tokenService.getToken();

  if (!token) {
    throw new Error('No authentication token found');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// ==================== TRANSACTIONS API ====================

export interface Transaction {
  id?: number;
  user_id?: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  date: string;
  tags?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TransactionFilters {
  type?: 'income' | 'expense';
  category?: string;
  tags?: string;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
  page?: number;
  page_size?: number;
  sort_by?: 'date' | 'amount' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

export interface TransactionSummary {
  total_income: number;
  total_expense: number;
  net_balance: number;
}

export const transactionService = {
  // Create transaction
  create: async (data: Transaction) => {
    return fetchWithAuth(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get all transactions
  getAll: async (filters?: TransactionFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    return fetchWithAuth(`${API_BASE_URL}/transactions?${params.toString()}`);
  },

  // Get transaction by ID
  getById: async (id: number) => {
    return fetchWithAuth(`${API_BASE_URL}/transactions/${id}`);
  },

  // Update transaction
  update: async (id: number, data: Partial<Transaction>) => {
    return fetchWithAuth(`${API_BASE_URL}/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete transaction
  delete: async (id: number) => {
    return fetchWithAuth(`${API_BASE_URL}/transactions/${id}`, {
      method: 'DELETE',
    });
  },

  // Get transactions by category
  getByCategory: async (category: string, page?: number, page_size?: number) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (page_size) params.append('page_size', page_size.toString());
    return fetchWithAuth(`${API_BASE_URL}/transactions/category/${category}?${params.toString()}`);
  },

  // Get transaction summary
  getSummary: async (date_from?: string, date_to?: string) => {
    const params = new URLSearchParams();
    if (date_from) params.append('date_from', date_from);
    if (date_to) params.append('date_to', date_to);
    return fetchWithAuth(`${API_BASE_URL}/transactions/summary?${params.toString()}`);
  },

  // Get category breakdown
  getBreakdown: async (type?: 'income' | 'expense', date_from?: string, date_to?: string) => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (date_from) params.append('date_from', date_from);
    if (date_to) params.append('date_to', date_to);
    return fetchWithAuth(`${API_BASE_URL}/transactions/breakdown?${params.toString()}`);
  },

  // Get monthly trend
  getTrend: async (months?: number) => {
    const params = new URLSearchParams();
    if (months) params.append('months', months.toString());
    return fetchWithAuth(`${API_BASE_URL}/transactions/trend?${params.toString()}`);
  },
};

// ==================== DAILY TARGETS API ====================

export interface DailyTarget {
  id?: number;
  user_id?: string;
  date: string;
  income_target: number;
  expense_limit: number;
  savings_target: number;
  actual_income?: number;
  actual_expense?: number;
  actual_savings?: number;
  remaining_income?: number;
  remaining_expense?: number;
  income_progress?: number;
  expense_progress?: number;
  savings_progress?: number;
  total_trades?: number;
  winning_trades?: number;
  losing_trades?: number;
  win_rate?: number;
  is_completed?: boolean;
  completed_at?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TradingActivity {
  id?: number;
  daily_target_id: number;
  user_id?: string;
  trade_type: 'win' | 'loss';
  amount: number;
  pips?: number;
  lot_size?: number;
  symbol?: string;
  description?: string;
  trade_time: string;
  created_at?: string;
  updated_at?: string;
}

export const dailyTargetService = {
  // Create daily target
  create: async (data: DailyTarget) => {
    return fetchWithAuth(`${API_BASE_URL}/daily-targets`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get all daily targets
  getAll: async (date_from?: string, date_to?: string, page?: number, page_size?: number) => {
    const params = new URLSearchParams();
    if (date_from) params.append('date_from', date_from);
    if (date_to) params.append('date_to', date_to);
    if (page) params.append('page', page.toString());
    if (page_size) params.append('page_size', page_size.toString());
    return fetchWithAuth(`${API_BASE_URL}/daily-targets?${params.toString()}`);
  },

  // Get today's target
  getToday: async () => {
    return fetchWithAuth(`${API_BASE_URL}/daily-targets/today`);
  },

  // Get current month summary
  getMonthSummary: async () => {
    return fetchWithAuth(`${API_BASE_URL}/daily-targets/month-summary`);
  },

  // Get week summary
  getWeekSummary: async () => {
    return fetchWithAuth(`${API_BASE_URL}/daily-targets/week-summary`);
  },

  // Get daily target by ID
  getById: async (id: number) => {
    return fetchWithAuth(`${API_BASE_URL}/daily-targets/${id}`);
  },

  // Update daily target
  update: async (id: number, data: Partial<DailyTarget>) => {
    return fetchWithAuth(`${API_BASE_URL}/daily-targets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete daily target
  delete: async (id: number) => {
    return fetchWithAuth(`${API_BASE_URL}/daily-targets/${id}`, {
      method: 'DELETE',
    });
  },

  // Refresh actual values
  refresh: async (id: number) => {
    return fetchWithAuth(`${API_BASE_URL}/daily-targets/${id}/refresh`, {
      method: 'POST',
    });
  },

  // Add trading activity (win/loss)
  addTrade: async (targetId: number, data: Omit<TradingActivity, 'id' | 'daily_target_id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    return fetchWithAuth(`${API_BASE_URL}/daily-targets/${targetId}/trades`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get trading activities by daily target
  getTrades: async (targetId: number) => {
    return fetchWithAuth(`${API_BASE_URL}/daily-targets/${targetId}/trades`);
  },
};

// ==================== TRADING ACTIVITIES API ====================

export const tradingActivityService = {
  // Delete trading activity
  delete: async (id: number) => {
    return fetchWithAuth(`${API_BASE_URL}/trading-activities/${id}`, {
      method: 'DELETE',
    });
  },

  // Get trading stats
  getStats: async (date_from?: string, date_to?: string) => {
    const params = new URLSearchParams();
    if (date_from) params.append('date_from', date_from);
    if (date_to) params.append('date_to', date_to);
    return fetchWithAuth(`${API_BASE_URL}/trading-activities/stats?${params.toString()}`);
  },
};

// ==================== FINANCIAL GOALS API ====================

export interface FinancialGoal {
  id?: number;
  user_id?: string;
  title: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  start_date: string;
  target_date: string;
  category?: string;
  priority: 0 | 1 | 2; // 0: Low, 1: Medium, 2: High
  priority_label?: 'low' | 'medium' | 'high';
  is_completed?: boolean;
  progress?: number;
  days_remaining?: number;
  required_per_day?: number;
  created_at?: string;
  updated_at?: string;
}

export interface GoalFilters {
  category?: string;
  priority?: 0 | 1 | 2;
  is_completed?: boolean;
  page?: number;
  page_size?: number;
}

export const financialGoalService = {
  // Create financial goal
  create: async (data: FinancialGoal) => {
    return fetchWithAuth(`${API_BASE_URL}/goals`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get all financial goals
  getAll: async (filters?: GoalFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    return fetchWithAuth(`${API_BASE_URL}/goals?${params.toString()}`);
  },

  // Get financial goal by ID
  getById: async (id: number) => {
    return fetchWithAuth(`${API_BASE_URL}/goals/${id}`);
  },

  // Update financial goal
  update: async (id: number, data: Partial<FinancialGoal>) => {
    return fetchWithAuth(`${API_BASE_URL}/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete financial goal
  delete: async (id: number) => {
    return fetchWithAuth(`${API_BASE_URL}/goals/${id}`, {
      method: 'DELETE',
    });
  },

  // Update goal progress (set to specific value)
  updateProgress: async (id: number, amount: number) => {
    return fetchWithAuth(`${API_BASE_URL}/goals/${id}/update-progress`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },

  // Add to goal progress (increment)
  addProgress: async (id: number, amount: number) => {
    return fetchWithAuth(`${API_BASE_URL}/goals/${id}/add-progress`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },

  // Get goals summary
  getSummary: async () => {
    return fetchWithAuth(`${API_BASE_URL}/goals/summary`);
  },
};

// ==================== BACKTEST STRATEGY API ====================

export interface BacktestStrategy {
  id?: number;
  user_id?: string;
  name: string;
  description?: string;
  strategy_type: 'savings' | 'investment' | 'expense_reduction';
  initial_amount: number;
  monthly_contribution: number;
  expected_return: number;
  duration: number; // in months
  start_date: string;
  end_date?: string;
  projected_amount?: number;
  actual_amount?: number;
  status?: 'draft' | 'active' | 'completed' | 'cancelled';
  performance_gap?: number;
  created_at?: string;
  updated_at?: string;
}

export interface BacktestFilters {
  strategy_type?: 'savings' | 'investment' | 'expense_reduction';
  status?: 'draft' | 'active' | 'completed' | 'cancelled';
  page?: number;
  page_size?: number;
}

export const backtestStrategyService = {
  // Create backtest strategy
  create: async (data: BacktestStrategy) => {
    return fetchWithAuth(`${API_BASE_URL}/backtest-strategies`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get all backtest strategies
  getAll: async (filters?: BacktestFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    return fetchWithAuth(`${API_BASE_URL}/backtest-strategies?${params.toString()}`);
  },

  // Get backtest strategy by ID
  getById: async (id: number) => {
    return fetchWithAuth(`${API_BASE_URL}/backtest-strategies/${id}`);
  },

  // Get backtest result
  getResult: async (id: number) => {
    return fetchWithAuth(`${API_BASE_URL}/backtest-strategies/${id}/result`);
  },

  // Update backtest strategy
  update: async (id: number, data: Partial<BacktestStrategy>) => {
    return fetchWithAuth(`${API_BASE_URL}/backtest-strategies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete backtest strategy
  delete: async (id: number) => {
    return fetchWithAuth(`${API_BASE_URL}/backtest-strategies/${id}`, {
      method: 'DELETE',
    });
  },

  // Run backtest
  run: async (id: number) => {
    return fetchWithAuth(`${API_BASE_URL}/backtest-strategies/${id}/run`, {
      method: 'POST',
    });
  },

  // Activate strategy
  activate: async (id: number) => {
    return fetchWithAuth(`${API_BASE_URL}/backtest-strategies/${id}/activate`, {
      method: 'POST',
    });
  },

  // Complete strategy
  complete: async (id: number, actual_amount: number) => {
    return fetchWithAuth(`${API_BASE_URL}/backtest-strategies/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ actual_amount }),
    });
  },
};

// ==================== BUDGETS API ====================

export interface Budget {
  id?: number;
  user_id?: string;
  category: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date: string;
  is_recurring: boolean;
  spent?: number;
  remaining?: number;
  percentage?: number;
  status?: 'good' | 'warning' | 'critical' | 'exceeded';
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BudgetFilters {
  category?: string;
  period?: 'weekly' | 'monthly' | 'yearly';
  is_active?: boolean;
  page?: number;
  page_size?: number;
}

export const budgetService = {
  // Create budget
  create: async (data: Budget) => {
    return fetchWithAuth(`${API_BASE_URL}/budgets`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get all budgets
  getAll: async (filters?: BudgetFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    return fetchWithAuth(`${API_BASE_URL}/budgets?${params.toString()}`);
  },

  // Get budget by ID
  getById: async (id: number) => {
    return fetchWithAuth(`${API_BASE_URL}/budgets/${id}`);
  },

  // Update budget
  update: async (id: number, data: Partial<Budget>) => {
    return fetchWithAuth(`${API_BASE_URL}/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete budget
  delete: async (id: number) => {
    return fetchWithAuth(`${API_BASE_URL}/budgets/${id}`, {
      method: 'DELETE',
    });
  },

  // Get budget summary
  getSummary: async () => {
    return fetchWithAuth(`${API_BASE_URL}/budgets/summary`);
  },

  // Get monthly budget report
  getMonthlyReport: async (year?: number, month?: number) => {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    return fetchWithAuth(`${API_BASE_URL}/budgets/monthly-report?${params.toString()}`);
  },

  // Check budget alerts
  getAlerts: async (threshold?: number) => {
    const params = new URLSearchParams();
    if (threshold) params.append('threshold', threshold.toString());
    return fetchWithAuth(`${API_BASE_URL}/budgets/alerts?${params.toString()}`);
  },
};
