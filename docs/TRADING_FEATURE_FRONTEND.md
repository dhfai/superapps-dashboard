# Trading Feature - Frontend Implementation

## Overview
The Daily Targets feature has been transformed into a **Trading Performance Tracking System**. This allows traders to:
- Set daily profit targets and loss limits (stop loss)
- Record each trade (win/loss) with detailed metadata
- Track win rate and trading statistics in real-time
- Auto-complete when target is reached or stop loss is hit
- Review trading history and performance

## Key Concepts

### Trading Terminology
- **Income Target** = Daily Profit Target (e.g., Rp 1,000,000)
- **Expense Limit** = Maximum Loss / Stop Loss (e.g., Rp 100,000)
- **Actual Income** = Total profits from winning trades
- **Actual Expense** = Total losses from losing trades
- **Remaining Income** = How much more profit needed to reach target
- **Remaining Expense** = How much more loss until stop loss is hit

### Trading Activity
Each trade is recorded with:
- **Trade Type**: Win or Loss
- **Amount**: Profit or loss amount in IDR
- **Pips**: Number of pips gained/lost (optional)
- **Lot Size**: Trading volume (optional)
- **Symbol**: Trading pair (e.g., EURUSD, XAUUSD)
- **Description**: Notes about the trade setup/strategy
- **Trade Time**: When the trade was closed

### Auto-Completion
A daily target is automatically marked as **completed** when:
1. ✅ **Target Reached**: `actual_income >= income_target` (Success!)
2. ❌ **Stop Loss Hit**: `actual_expense >= expense_limit` (Cut losses!)

Once completed, no more trades can be added for that day.

## API Integration

### 1. Daily Target Service

```typescript
import { dailyTargetService } from "@/lib/api/finance";

// Create new trading target
await dailyTargetService.create({
  date: "2024-01-15T00:00:00Z",
  income_target: 1000000,    // Profit target: Rp 1 juta
  expense_limit: 100000,      // Stop loss: Rp 100 ribu
  savings_target: 500000,     // Savings goal
  notes: "Trading plan: Focus on EURUSD during London session"
});

// Get today's target
const todayRes = await dailyTargetService.getToday();
console.log(todayRes.data);
// {
//   id: 1,
//   date: "2024-01-15T00:00:00Z",
//   income_target: 1000000,
//   expense_limit: 100000,
//   actual_income: 450000,
//   actual_expense: 30000,
//   remaining_income: 550000,
//   remaining_expense: 70000,
//   total_trades: 5,
//   winning_trades: 3,
//   losing_trades: 2,
//   win_rate: 60.0,
//   is_completed: false,
//   completed_at: null
// }

// Add a winning trade
await dailyTargetService.addTrade(targetId, {
  trade_type: "win",
  amount: 150000,
  pips: 25,
  lot_size: 0.1,
  symbol: "EURUSD",
  description: "Breakout strategy on H1 chart",
  trade_time: "2024-01-15T10:30:00Z"
});

// Add a losing trade
await dailyTargetService.addTrade(targetId, {
  trade_type: "loss",
  amount: 30000,
  pips: -10,
  lot_size: 0.05,
  symbol: "GBPUSD",
  description: "False breakout, stopped out",
  trade_time: "2024-01-15T14:00:00Z"
});

// Get all trades for a target
const tradesRes = await dailyTargetService.getTrades(targetId);
console.log(tradesRes.data);
// [
//   {
//     id: 1,
//     daily_target_id: 1,
//     trade_type: "win",
//     amount: 150000,
//     pips: 25,
//     lot_size: 0.1,
//     symbol: "EURUSD",
//     description: "Breakout strategy on H1 chart",
//     trade_time: "2024-01-15T10:30:00Z"
//   },
//   ...
// ]
```

### 2. Trading Activity Service

```typescript
import { tradingActivityService } from "@/lib/api/finance";

// Delete a trade (auto-recalculates target stats)
await tradingActivityService.delete(tradeId);

// Get trading statistics for date range
const statsRes = await tradingActivityService.getStats(
  "2024-01-01",  // date_from
  "2024-01-31"   // date_to
);
console.log(statsRes.data);
// {
//   total_trades: 120,
//   winning_trades: 75,
//   losing_trades: 45,
//   win_rate: 62.5,
//   total_profit: 12500000,
//   total_loss: 3200000,
//   net_profit: 9300000
// }
```

## UI Components

### 1. Today's Trading Performance Card

**Features:**
- Displays current trading statistics (total trades, win rate, wins, losses)
- Shows profit and loss progress bars with remaining targets
- Completion badge (Target Reached / Stop Loss Hit)
- "Record Trade" button (disabled when completed)
- Tabs for Statistics and Trades History

**Code Example:**
```tsx
{todayTarget && (
  <Card className="border-2 border-primary">
    <CardHeader>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <IconChartCandle className="w-5 h-5 text-primary" />
            Today's Trading Performance
          </CardTitle>
          <CardDescription>{formatDate(todayTarget.date)}</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {todayTarget.is_completed && (
            <Badge variant={todayTarget.actual_income >= todayTarget.income_target ? "default" : "destructive"}>
              {todayTarget.actual_income >= todayTarget.income_target ? "✓ Target Reached" : "✗ Stop Loss Hit"}
            </Badge>
          )}
          <Button size="sm" disabled={todayTarget.is_completed}>
            <IconPlus className="w-4 h-4 mr-1" />
            Record Trade
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      {/* Stats Grid: Total Trades, Win Rate, Wins, Losses */}
      {/* Progress Bars: Profit Target, Loss Limit */}
      {/* Tabs: Statistics, Trades History */}
    </CardContent>
  </Card>
)}
```

### 2. Record Trade Dialog

**Features:**
- Win/Loss toggle buttons (visual selection)
- Amount input (required)
- Pips and Lot Size inputs (optional)
- Symbol/Pair input (text)
- Trade Time (datetime picker)
- Description/Notes (textarea)

**Form Data:**
```typescript
const [tradeFormData, setTradeFormData] = useState({
  trade_type: "win" as "win" | "loss",
  amount: 0,
  pips: 0,
  lot_size: 0,
  symbol: "",
  description: "",
  trade_time: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
});

const handleSubmitTrade = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!todayTarget) {
    toast.error("No target for today. Please create a target first.");
    return;
  }

  await dailyTargetService.addTrade(todayTarget.id, tradeFormData);
  toast.success("Trade recorded successfully");
  setIsTradeDialogOpen(false);
  resetTradeForm();
  fetchData(); // Refresh to get updated stats
};
```

### 3. Trades History Tab

**Features:**
- List of all trades for today's target
- Win/Loss badge with color coding
- Amount, symbol, time, pips, lot size display
- Delete button for each trade
- Empty state with "Record First Trade" button

**Trade Item:**
```tsx
<div className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
  <div className="flex items-start justify-between">
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-2">
        <Badge variant={trade.trade_type === "win" ? "default" : "destructive"}>
          {trade.trade_type === "win" ? "✓ Win" : "✗ Loss"}
        </Badge>
        <span className={`font-semibold ${trade.trade_type === "win" ? "text-green-600" : "text-red-600"}`}>
          {formatCurrency(trade.amount)}
        </span>
        {trade.symbol && <Badge variant="outline">{trade.symbol}</Badge>}
      </div>
      <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground">
        <div>Time: {format(new Date(trade.trade_time), "HH:mm")}</div>
        {trade.pips && <div>Pips: {trade.pips}</div>}
        {trade.lot_size && <div>Lot: {trade.lot_size}</div>}
      </div>
      {trade.description && <p className="text-xs text-muted-foreground mt-2">{trade.description}</p>}
    </div>
    <Button variant="ghost" size="sm" onClick={() => handleDeleteTrade(trade.id)} disabled={todayTarget.is_completed}>
      <IconTrash className="w-4 h-4 text-red-500" />
    </Button>
  </div>
</div>
```

### 4. Monthly Trading Summary

**Features:**
- Profit targets hit count
- Days within loss limit count
- Net profit/loss calculation
- Savings achieved

**Code:**
```tsx
{monthSummary && (
  <Card>
    <CardHeader>
      <CardTitle>This Month's Trading Performance</CardTitle>
      <CardDescription>{monthSummary.total_days} trading days</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <div className="text-sm text-muted-foreground mb-2">Profit Targets Hit</div>
          <div className="text-2xl font-bold text-green-600">
            {monthSummary.days_met_income} / {monthSummary.total_days}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Total Profit: {formatCurrency(monthSummary.total_actual_income)}
          </div>
        </div>
        {/* More metrics... */}
      </div>
    </CardContent>
  </Card>
)}
```

### 5. Trading History List

**Features:**
- Shows all daily targets for the month
- Displays trading metrics (trades, win rate, wins/losses)
- Profit and loss amounts with progress bars
- Completion badges
- Edit and delete buttons

**Metrics Display:**
```tsx
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
      <span className="text-green-600">{target.winning_trades || 0}</span> /
      <span className="text-red-600">{target.losing_trades || 0}</span>
    </div>
  </div>
  {/* Profit and Loss columns... */}
</div>
```

## State Management

```typescript
const [targets, setTargets] = useState<any[]>([]);                    // All targets
const [todayTarget, setTodayTarget] = useState<any>(null);            // Today's target
const [tradingActivities, setTradingActivities] = useState<any[]>([]); // Today's trades
const [monthSummary, setMonthSummary] = useState<any>(null);          // Month stats
const [loading, setLoading] = useState(true);
const [isDialogOpen, setIsDialogOpen] = useState(false);              // Target form
const [isTradeDialogOpen, setIsTradeDialogOpen] = useState(false);    // Trade form
const [editingTarget, setEditingTarget] = useState<any>(null);

// Fetch all data
const fetchData = async () => {
  const todayRes = await dailyTargetService.getToday();
  setTodayTarget(todayRes.data);

  if (todayRes.data?.id) {
    const tradesRes = await dailyTargetService.getTrades(todayRes.data.id);
    setTradingActivities(tradesRes.data || []);
  }

  const monthRes = await dailyTargetService.getMonthSummary();
  setMonthSummary(monthRes.data);

  // Fetch all targets for current month...
};
```

## User Workflow

### 1. Start of Trading Day
1. User navigates to **Trading Targets** page
2. Clicks **"Create Trading Target"** button
3. Sets:
   - Date (today)
   - Profit Target (e.g., Rp 1,000,000)
   - Loss Limit/Stop Loss (e.g., Rp 100,000)
   - Savings Target (e.g., Rp 500,000)
   - Notes/Trading Plan
4. Clicks **"Create"**

### 2. Recording Trades
1. User opens a trade and closes it (win or loss)
2. Clicks **"Record Trade"** button
3. Selects **Win** or **Loss**
4. Enters:
   - Amount (required)
   - Pips (optional)
   - Lot Size (optional)
   - Symbol (e.g., EURUSD)
   - Trade Time
   - Description (strategy, reason, etc.)
5. Clicks **"Record Trade"**
6. UI instantly updates with:
   - New trade in history
   - Updated win rate
   - Updated profit/loss progress
   - Updated remaining targets

### 3. Monitoring Performance
1. User views **Statistics Tab** for:
   - Total trades count
   - Win rate percentage
   - Wins vs losses breakdown
   - Profit progress bar
   - Loss limit progress bar
   - Remaining targets
2. Switches to **Trades History Tab** to review individual trades
3. Can delete trades if needed (recalculates stats automatically)

### 4. Target Completion
**Scenario A: Target Reached** ✅
- User achieves profit target (e.g., Rp 1,000,000)
- Backend automatically sets `is_completed = true`
- UI shows green badge: **"✓ Target Reached"**
- "Record Trade" button becomes disabled
- User sees completion in history list

**Scenario B: Stop Loss Hit** ❌
- User's losses reach the limit (e.g., Rp 100,000)
- Backend automatically sets `is_completed = true`
- UI shows red badge: **"✗ Stop Loss Hit"**
- "Record Trade" button becomes disabled
- Trading stops for the day to prevent further losses

### 5. Monthly Review
1. User scrolls to **"This Month's Trading Performance"** card
2. Views:
   - How many days profit target was hit
   - How many days stayed within loss limit
   - Net profit/loss for the month
   - Total savings achieved
3. Reviews **Trading History** list:
   - Each day's performance
   - Win rates across all days
   - Best and worst trading days
   - Patterns and trends

## Best Practices

### 1. Risk Management
- Set realistic profit targets based on account size
- **Always set stop loss** (expense limit) to protect capital
- Recommended ratio: 10:1 (e.g., Target Rp 1M, Stop Loss Rp 100K)
- Stop trading when either target is reached or stop loss is hit

### 2. Record Keeping
- Record **every trade** immediately after closing
- Include detailed descriptions (setup, entry reason, mistakes)
- Note pips and lot size for performance analysis
- Specify trading pairs/symbols for pair-specific stats

### 3. Performance Tracking
- Review win rate daily (aim for >50%)
- Track which symbols/pairs are most profitable
- Identify patterns in winning vs losing trades
- Use monthly summary to assess overall progress

### 4. Psychology
- If stop loss is hit, **STOP trading** for the day
- Don't chase losses or overtrade
- If target is reached, consider stopping or reducing lot size
- Use notes field to journal emotions and mindset

## Technical Details

### Date Handling
```typescript
import { format } from "date-fns";

// Display date
formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Form date input
format(new Date(formData.date), "yyyy-MM-dd")

// ISO string for API
new Date(e.target.value).toISOString()
```

### Currency Formatting
```typescript
formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}
```

### Progress Color Coding
```typescript
const getProgressColor = (progress: number) => {
  if (progress >= 100) return "text-green-600";
  if (progress >= 75) return "text-blue-600";
  if (progress >= 50) return "text-yellow-600";
  return "text-red-600";
};
```

### Win Rate Color
```typescript
className={`text-2xl ${(todayTarget.win_rate || 0) >= 50 ? 'text-green-600' : 'text-red-600'}`}
```

## Icons Used
- `IconChartCandle` - Main trading icon
- `IconTrendingUp` - Win/profit indicator
- `IconTrendingDown` - Loss indicator
- `IconCheck` - Success/target reached
- `IconX` - Stop loss/failure
- `IconChartLine` - Trading history
- `IconPlus` - Add trade/target
- `IconEdit` - Edit target
- `IconTrash` - Delete trade/target

## Error Handling

```typescript
const handleSubmitTrade = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!todayTarget) {
    toast.error("No target for today. Please create a target first.");
    return;
  }

  try {
    await dailyTargetService.addTrade(todayTarget.id, tradeFormData);
    toast.success("Trade recorded successfully");
    setIsTradeDialogOpen(false);
    resetTradeForm();
    fetchData();
  } catch (error: any) {
    toast.error(error.message || "Failed to record trade");
  }
};
```

## Future Enhancements

### Planned Features
1. **Trading Journal Export** - Export trades to CSV/PDF
2. **Advanced Analytics** - Charts for win rate trends, profit curves
3. **Pair-Specific Stats** - Best/worst performing symbols
4. **Time-Based Analysis** - Best trading hours/sessions
5. **Risk/Reward Ratio** - Track R:R for each trade
6. **Trading Strategies Tagging** - Categorize trades by strategy
7. **Multi-Timeframe View** - Week/month/year statistics
8. **Goal Setting** - Long-term profit goals and progress
9. **Alerts** - Notifications when near stop loss or target
10. **Social Sharing** - Share trading results (with privacy controls)

### Performance Optimizations
- Implement pagination for trades history
- Add loading skeletons for better UX
- Cache trading statistics
- Lazy load historical data
- Optimize re-renders with React.memo

## Conclusion

The Trading Feature transforms Daily Targets into a comprehensive trading journal and performance tracker. By automatically calculating win rates, tracking remaining targets, and enforcing stop losses, it helps traders maintain discipline and improve their trading results over time.

Key Benefits:
- ✅ Real-time performance tracking
- ✅ Automatic risk management (stop loss)
- ✅ Data-driven insights (win rate, profit/loss)
- ✅ Complete trading history
- ✅ Monthly performance review
- ✅ Psychological discipline (auto-completion)

Start using the Trading Feature today to take your trading to the next level! 🚀📈
