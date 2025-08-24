"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { apiGet } from "@/lib/api";
import { Card, Title, Button, Badge } from "@/components/UI";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id?: string;
  date: string;
  description?: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  balance_after: number;
  created_at?: string;
}

interface Account {
  id: string;
  user_id: string;
  name: string;
  initial_balance: number;
  created_at?: string;
}

interface Category {
  id: string;
  user_id: string;
  name: string;
  created_at?: string;
}

// Loading Spinner Component
const LoadingSpinner = ({ size = "sm" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  };

  return (
    <svg
      className={`${sizeClasses[size]} animate-spin text-gray-600 dark:text-gray-400`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
};

export default function HomePage() {
  const { session } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const features = [
    {
      title: "Track Expenses",
      description: "Monitor your daily spending with detailed categories",
      icon: "💰",
      href: "/transactions"
    },
    {
      title: "Manage Categories",
      description: "Organize your finances with custom categories",
      icon: "📊",
      href: "/categories"
    },
    {
      title: "Account Overview",
      description: "View all your accounts in one place",
      icon: "🏦",
      href: "/accounts"
    }
  ];

  async function loadDashboardData() {
    if (!session) return;

    setLoading(true);
    try {
      const [transactionsRes, accountsRes, categoriesRes] = await Promise.all([
        apiGet<Transaction[]>("/transactions", session.access_token),
        apiGet<Account[]>("/accounts", session.access_token),
        apiGet<Category[]>("/categories", session.access_token)
      ]);

      setTransactions(transactionsRes);
      setAccounts(accountsRes);
      setCategories(categoriesRes);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
    /* eslint-disable-next-line */
  }, [session]);

  // Calculate statistics
  const totalIncome = transactions
    .filter(t => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // Calculate account balances
  const accountBalances = accounts.map(account => {
    const accountTransactions = transactions
      .filter(t => t.account_id === account.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const lastTransaction = accountTransactions[accountTransactions.length - 1];
    const currentBalance = lastTransaction?.balance_after || account.initial_balance;
    
    return {
      ...account,
      currentBalance,
      transactionCount: accountTransactions.length
    };
  });

  // Prepare data for monthly trend chart (last 6 months)
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStr = date.toISOString().slice(0, 7); // YYYY-MM format
    
    const monthTransactions = transactions.filter(t => t.date.startsWith(monthStr));
    const monthIncome = monthTransactions
      .filter(t => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);
    const monthExpense = monthTransactions
      .filter(t => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);
    
    monthlyData.push({
      month: date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
      income: monthIncome,
      expense: monthExpense,
      net: monthIncome - monthExpense
    });
  }

  // Prepare data for category pie chart (expenses only)
  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return "Uncategorized";
    const category = categories.find(c => c.id === categoryId);
    return category?.name || "Unknown Category";
  };

  const categoryData = categories
    .map(category => {
      const categoryExpenses = transactions
        .filter(t => t.type === "EXPENSE" && t.category_id === category.id)
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        name: category.name,
        value: categoryExpenses,
        percentage: totalExpense > 0 ? ((categoryExpenses / totalExpense) * 100).toFixed(1) : "0"
      };
    })
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  // Add uncategorized expenses
  const uncategorizedExpenses = transactions
    .filter(t => t.type === "EXPENSE" && !t.category_id)
    .reduce((sum, t) => sum + t.amount, 0);

  if (uncategorizedExpenses > 0) {
    categoryData.push({
      name: "Uncategorized",
      value: uncategorizedExpenses,
      percentage: totalExpense > 0 ? ((uncategorizedExpenses / totalExpense) * 100).toFixed(1) : "0"
    });
  }

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

  // Recent transactions (last 5)
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Weekly spending trend (last 7 days)
  const weeklyData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayTransactions = transactions.filter(t => t.date === dateStr);
    const dayIncome = dayTransactions
      .filter(t => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);
    const dayExpense = dayTransactions
      .filter(t => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);
    
    weeklyData.push({
      day: date.toLocaleDateString('id-ID', { weekday: 'short' }),
      income: dayIncome,
      expense: dayExpense
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="space-y-8 p-6">
        {/* Header with animated gradient */}
        <div className="text-center space-y-6 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10 rounded-3xl blur-3xl"></div>
          <div className="relative">
            <Title className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
              Duitku Dashboard
            </Title>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto font-medium">
              Take control of your finances with comprehensive analytics and insights
            </p>
          </div>
        </div>

        {session ? (
          <div className="space-y-8">
            {/* Welcome Card with enhanced styling */}
            <Card className="text-center relative overflow-hidden border-0 shadow-lg bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-indigo-500/5"></div>
              <div className="relative p-8">
                <div className="flex items-center justify-center mb-6">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {session.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -inset-1 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-500 rounded-2xl blur opacity-20"></div>
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-3 text-slate-800 dark:text-slate-100">Welcome back!</h2>
                <p className="text-slate-600 dark:text-slate-300 text-lg">
                  Logged in as <span className="font-semibold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">{session.email}</span>
                </p>
              </div>
            </Card>

            {loading ? (
              <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-6 text-slate-600 dark:text-slate-300 text-lg">Loading your financial data...</p>
                  </div>
                </div>
              </Card>
            ) : (
              <>
                {/* Enhanced Financial Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 hover:shadow-2xl transition-all duration-300 hover:scale-105">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-green-400/20 rounded-full blur-xl"></div>
                    <div className="relative p-6 text-center">
                      <div className="text-4xl mb-4">💰</div>
                      <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-2 uppercase tracking-wide">Total Income</h3>
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-3">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(totalIncome)}
                      </p>
                      <Badge variant="success" className="text-xs font-medium px-3 py-1">
                        {transactions.filter(t => t.type === "INCOME").length} transactions
                      </Badge>
                    </div>
                  </Card>

                  <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-rose-50 to-red-100 dark:from-rose-900/30 dark:to-red-900/30 hover:shadow-2xl transition-all duration-300 hover:scale-105">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-400/20 to-red-400/20 rounded-full blur-xl"></div>
                    <div className="relative p-6 text-center">
                      <div className="text-4xl mb-4">💸</div>
                      <h3 className="text-sm font-semibold text-rose-700 dark:text-rose-300 mb-2 uppercase tracking-wide">Total Expenses</h3>
                      <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mb-3">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(totalExpense)}
                      </p>
                      <Badge variant="secondary" className="text-xs font-medium px-3 py-1">
                        {transactions.filter(t => t.type === "EXPENSE").length} transactions
                      </Badge>
                    </div>
                  </Card>

                  <Card className={`relative overflow-hidden border-0 shadow-xl ${netBalance >= 0 
                    ? 'bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30' 
                    : 'bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30'} hover:shadow-2xl transition-all duration-300 hover:scale-105`}>
                    <div className={`absolute top-0 right-0 w-24 h-24 ${netBalance >= 0 
                      ? 'bg-gradient-to-br from-blue-400/20 to-cyan-400/20' 
                      : 'bg-gradient-to-br from-orange-400/20 to-amber-400/20'} rounded-full blur-xl`}></div>
                    <div className="relative p-6 text-center">
                      <div className="text-4xl mb-4">{netBalance >= 0 ? '📈' : '📉'}</div>
                      <h3 className={`text-sm font-semibold mb-2 uppercase tracking-wide ${netBalance >= 0 
                        ? 'text-blue-700 dark:text-blue-300' 
                        : 'text-orange-700 dark:text-orange-300'}`}>Net Balance</h3>
                      <p className={`text-2xl font-bold mb-3 ${netBalance >= 0 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-orange-600 dark:text-orange-400'}`}>
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(netBalance)}
                      </p>
                      <Badge variant={netBalance >= 0 ? "default" : "warning"} className="text-xs font-medium px-3 py-1">
                        {netBalance >= 0 ? 'Surplus' : 'Deficit'}
                      </Badge>
                    </div>
                  </Card>

                  <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 hover:shadow-2xl transition-all duration-300 hover:scale-105">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-indigo-400/20 rounded-full blur-xl"></div>
                    <div className="relative p-6 text-center">
                      <div className="text-4xl mb-4">🏦</div>
                      <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2 uppercase tracking-wide">Total Accounts</h3>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-3">
                        {accounts.length}
                      </p>
                      <Badge variant="default" className="text-xs font-medium px-3 py-1">
                        {categories.length} categories
                      </Badge>
                    </div>
                  </Card>
                </div>

                {/* Enhanced Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Monthly Trend Chart */}
                  <Card className="border-0 shadow-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <span className="bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                          Monthly Trend (6 Months)
                        </span>
                      </h3>
                      <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-700 rounded-xl p-4">
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={monthlyData}>
                            <defs>
                              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                              </linearGradient>
                              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="month" stroke="#64748b" />
                            <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} stroke="#64748b" />
                            <Tooltip 
                              contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                border: 'none',
                                borderRadius: '12px',
                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                                padding: '12px'
                              }}
                              formatter={(value: number, name: string) => [
                                new Intl.NumberFormat('id-ID', {
                                  style: 'currency',
                                  currency: 'IDR',
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0
                                }).format(value),
                                name === 'income' ? 'Income' : name === 'expense' ? 'Expense' : 'Net'
                              ]}
                            />
                            <Area type="monotone" dataKey="income" stackId="1" stroke="#10B981" fill="url(#incomeGradient)" strokeWidth={3} />
                            <Area type="monotone" dataKey="expense" stackId="2" stroke="#EF4444" fill="url(#expenseGradient)" strokeWidth={3} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </Card>

                  {/* Weekly Activity Chart */}
                  <Card className="border-0 shadow-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className="bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                          Weekly Activity (7 Days)
                        </span>
                      </h3>
                      <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-700 rounded-xl p-4">
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={weeklyData}>
                            <defs>
                              <linearGradient id="incomeBar" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10B981" />
                                <stop offset="100%" stopColor="#059669" />
                              </linearGradient>
                              <linearGradient id="expenseBar" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#EF4444" />
                                <stop offset="100%" stopColor="#DC2626" />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="day" stroke="#64748b" />
                            <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} stroke="#64748b" />
                            <Tooltip 
                              contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                border: 'none',
                                borderRadius: '12px',
                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                                padding: '12px'
                              }}
                              formatter={(value: number, name: string) => [
                                new Intl.NumberFormat('id-ID', {
                                  style: 'currency',
                                  currency: 'IDR',
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0
                                }).format(value),
                                name === 'income' ? 'Income' : 'Expense'
                              ]}
                            />
                            <Bar dataKey="income" fill="url(#incomeBar)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expense" fill="url(#expenseBar)" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </Card>

                  {/* Enhanced Expense Categories Pie Chart */}
                  {categoryData.length > 0 && (
                    <Card className="p-8 border-0 shadow-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm lg:col-span-2">
                      <h3 className="text-2xl font-bold mb-8 flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                          </svg>
                        </div>
                        <span className="bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                          Expense Categories
                        </span>
                      </h3>
                      
                      <div className="grid lg:grid-cols-3 gap-8">
                        {/* Enhanced Pie Chart */}
                        <div className="lg:col-span-2">
                          <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-700 rounded-2xl p-6 shadow-inner">
                            <ResponsiveContainer width="100%" height={400}>
                              <PieChart>
                                <defs>
                                  {categoryData.map((entry, index) => (
                                    <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                      <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={1} />
                                      <stop offset="100%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.7} />
                                    </linearGradient>
                                  ))}
                                </defs>
                                <Pie
                                  data={categoryData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={140}
                                  paddingAngle={3}
                                  dataKey="value"
                                  label={({ name, percentage }) => percentage > 8 ? `${percentage}%` : ''}
                                  labelLine={false}
                                >
                                  {categoryData.map((entry, index) => (
                                    <Cell 
                                      key={`cell-${index}`} 
                                      fill={`url(#gradient-${index})`}
                                      stroke="#fff"
                                      strokeWidth={3}
                                    />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    border: 'none',
                                    borderRadius: '16px',
                                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                                    padding: '16px'
                                  }}
                                  formatter={(value: number, name: string) => [
                                    new Intl.NumberFormat('id-ID', {
                                      style: 'currency',
                                      currency: 'IDR',
                                      minimumFractionDigits: 0,
                                      maximumFractionDigits: 0
                                    }).format(value),
                                    name
                                  ]} 
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        
                        {/* Enhanced Legend & Summary */}
                        <div className="space-y-6">
                          <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-2xl p-6 shadow-inner">
                            <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-3">
                              <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                              Categories Breakdown
                            </h4>
                            <div className="space-y-4">
                              {categoryData.map((entry, index) => (
                                <div key={entry.name} className="group">
                                  <div className="flex items-center justify-between p-4 hover:bg-white dark:hover:bg-slate-600 hover:shadow-md rounded-xl transition-all duration-200 border border-transparent hover:border-slate-200 dark:hover:border-slate-500">
                                    <div className="flex items-center gap-4">
                                      <div className="relative">
                                        <div 
                                          className="w-4 h-4 rounded-full shadow-lg"
                                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                        ></div>
                                        <div 
                                          className="absolute inset-0 w-4 h-4 rounded-full opacity-20 blur-sm"
                                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                        ></div>
                                      </div>
                                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-slate-100">
                                        {entry.name}
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                        {entry.percentage}%
                                      </div>
                                      <div className="text-xs text-slate-500 dark:text-slate-400">
                                        {new Intl.NumberFormat('id-ID', {
                                          style: 'currency',
                                          currency: 'IDR',
                                          minimumFractionDigits: 0,
                                          maximumFractionDigits: 0,
                                          notation: 'compact'
                                        }).format(entry.value)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Enhanced Total Summary */}
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl p-6 border border-blue-200 dark:border-blue-800 shadow-lg">
                            <div className="text-center">
                              <div className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2 uppercase tracking-wide">Total Expenses</div>
                              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                {new Intl.NumberFormat('id-ID', {
                                  style: 'currency',
                                  currency: 'IDR',
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0
                                }).format(categoryData.reduce((sum, item) => sum + item.value, 0))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Enhanced Account Balances */}
                  <Card className="border-0 shadow-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </div>
                        <span className="bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                          Account Balances
                        </span>
                      </h3>
                      <div className="space-y-4">
                        {accountBalances.length === 0 ? (
                          <div className="text-center py-12">
                            <div className="text-4xl mb-4">🏦</div>
                            <p className="text-slate-500 dark:text-slate-400">No accounts found</p>
                          </div>
                        ) : (
                          accountBalances.map((account) => (
                            <div key={account.id} className="group">
                              <div className="flex items-center justify-between p-5 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border border-slate-200 dark:border-slate-600">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                                    {account.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-slate-900 dark:group-hover:text-white">
                                      {account.name}
                                    </h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                      {account.transactionCount} transactions
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className={`font-bold text-lg ${account.currentBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    {new Intl.NumberFormat('id-ID', {
                                      style: 'currency',
                                      currency: 'IDR',
                                      minimumFractionDigits: 0,
                                      maximumFractionDigits: 0
                                    }).format(account.currentBalance)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Enhanced Recent Transactions */}
                <Card className="border-0 shadow-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                        Recent Transactions
                      </span>
                      <Badge variant="default" className="text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">{recentTransactions.length}</Badge>
                    </h3>
                    <div className="space-y-3">
                      {recentTransactions.length === 0 ? (
                        <div className="text-center py-16">
                          <div className="text-5xl mb-4">💳</div>
                          <p className="text-slate-500 dark:text-slate-400 text-lg">No transactions found</p>
                        </div>
                      ) : (
                        recentTransactions.map((transaction) => {
                          const account = accounts.find(a => a.id === transaction.account_id);
                          const category = categories.find(c => c.id === transaction.category_id);
                          
                          return (
                            <div key={transaction.id} className="group">
                              <div className="flex items-center justify-between p-5 hover:bg-gradient-to-r hover:from-slate-50 hover:to-white dark:hover:from-slate-700 dark:hover:to-slate-800 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-[1.01] border border-transparent hover:border-slate-200 dark:hover:border-slate-600">
                                <div className="flex items-center gap-4">
                                  <div className="relative">
                                    <div className={`text-2xl p-2 rounded-lg ${transaction.type === "INCOME" ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-rose-100 dark:bg-rose-900/30'}`}>
                                      {transaction.type === "INCOME" ? "💰" : "💸"}
                                    </div>
                                    <div className={`absolute -inset-1 ${transaction.type === "INCOME" ? 'bg-emerald-200 dark:bg-emerald-800' : 'bg-rose-200 dark:bg-rose-800'} rounded-lg blur opacity-20 group-hover:opacity-40 transition-opacity`}></div>
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-slate-900 dark:group-hover:text-white">
                                      {transaction.description || "No description"}
                                    </h4>
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                      <span className="font-medium">{account?.name}</span>
                                      <span>•</span>
                                      <span>{category?.name || "Uncategorized"}</span>
                                      <span>•</span>
                                      <span>{new Date(transaction.date).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className={`font-bold text-lg ${transaction.type === "INCOME" ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    {transaction.type === "INCOME" ? "+" : "-"}
                                    {new Intl.NumberFormat('id-ID', {
                                      style: 'currency',
                                      currency: 'IDR',
                                      minimumFractionDigits: 0,
                                      maximumFractionDigits: 0
                                    }).format(transaction.amount)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      {recentTransactions.length > 0 && (
                        <div className="text-center pt-6">
                          <Link href="/transactions">
                            <Button variant="outline" size="sm" className="font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105">
                              View All Transactions
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Enhanced Quick Actions */}
                <Card className="border-0 shadow-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <span className="bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                        Quick Actions
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Link href="/transactions">
                        <Button variant="outline" className="w-full h-16 group relative overflow-hidden border-2 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-xl transition-all duration-300 hover:scale-105">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <div className="relative flex items-center justify-center gap-3">
                            <svg className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            <span className="font-semibold">Add Transaction</span>
                          </div>
                        </Button>
                      </Link>
                      <Link href="/categories">
                        <Button variant="outline" className="w-full h-16 group relative overflow-hidden border-2 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-xl transition-all duration-300 hover:scale-105">
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <div className="relative flex items-center justify-center gap-3">
                            <svg className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            <span className="font-semibold">Manage Categories</span>
                          </div>
                        </Button>
                      </Link>
                      <Link href="/accounts">
                        <Button variant="outline" className="w-full h-16 group relative overflow-hidden border-2 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-xl transition-all duration-300 hover:scale-105">
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <div className="relative flex items-center justify-center gap-3">
                            <svg className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            <span className="font-semibold">View Accounts</span>
                          </div>
                        </Button>
                      </Link>
                      <Link href="/transactions">
                        <Button variant="outline" className="w-full h-16 group relative overflow-hidden border-2 hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-xl transition-all duration-300 hover:scale-105">
                          <div className="absolute inset-0 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <div className="relative flex items-center justify-center gap-3">
                            <svg className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <span className="font-semibold">View Analytics</span>
                          </div>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>

                {/* Enhanced Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {features.map((feature, index) => (
                    <Link key={index} href={feature.href}>
                      <Card className="h-full border-0 shadow-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer group relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:via-purple-900/10 dark:to-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative p-8 text-center space-y-6">
                          <div className="text-5xl group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {feature.title}
                          </h3>
                          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Enhanced Hero Section */}
            <Card className="text-center border-0 shadow-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-indigo-500/5"></div>
              <div className="relative p-12 max-w-4xl mx-auto space-y-8">
                <div className="text-7xl mb-6 animate-bounce">💳</div>
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                  Start Managing Your Money Today
                </h2>
                <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
                  Join thousands of users who are already taking control of their finances with Duitku
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center pt-4">
                  <Link href="/login">
                    <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                      <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold border-2 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Create Account
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>

            {/* Enhanced Features Demo Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-0 shadow-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <span className="text-3xl">📊</span>
                    <span className="bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                      Analytics Dashboard
                    </span>
                  </h3>
                  <div className="bg-gradient-to-br from-blue-50 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/30 rounded-2xl p-8 shadow-inner">
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div className="text-center bg-white/60 dark:bg-slate-800/60 rounded-xl p-4">
                        <div className="text-3xl font-bold text-emerald-600 mb-1">Rp 15M</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">Income</div>
                      </div>
                      <div className="text-center bg-white/60 dark:bg-slate-800/60 rounded-xl p-4">
                        <div className="text-3xl font-bold text-rose-600 mb-1">Rp 10M</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">Expenses</div>
                      </div>
                    </div>
                    <div className="h-20 bg-gradient-to-r from-emerald-200 via-blue-200 to-purple-200 dark:from-emerald-800 dark:via-blue-800 dark:to-purple-800 rounded-xl shadow-inner mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400 text-center font-medium">
                      Visualize your financial trends with interactive charts
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="border-0 shadow-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <span className="text-3xl">🏦</span>
                    <span className="bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                      Smart Categories
                    </span>
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-5 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl border border-orange-200 dark:border-orange-800 shadow-md">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl">🍽️</div>
                        <span className="font-bold text-slate-800 dark:text-slate-100">Food & Dining</span>
                      </div>
                      <div className="text-lg font-bold text-rose-600">Rp 2.5M</div>
                    </div>
                    <div className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200 dark:border-blue-800 shadow-md">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl">🚗</div>
                        <span className="font-bold text-slate-800 dark:text-slate-100">Transportation</span>
                      </div>
                      <div className="text-lg font-bold text-rose-600">Rp 1.8M</div>
                    </div>
                    <div className="flex items-center justify-between p-5 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200 dark:border-purple-800 shadow-md">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl">🎬</div>
                        <span className="font-bold text-slate-800 dark:text-slate-100">Entertainment</span>
                      </div>
                      <div className="text-lg font-bold text-rose-600">Rp 800K</div>
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mt-6 text-center font-medium">
                    Automatically categorize and track your spending patterns
                  </p>
                </div>
              </Card>
            </div>

            {/* Enhanced Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="text-center border-0 shadow-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-105 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:via-purple-900/10 dark:to-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative p-8 space-y-6">
                    <div className="text-5xl group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </Card>
              ))}
            </div>

            {/* Enhanced Benefits Section */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
              <div className="relative p-12">
                <div className="text-center mb-10">
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                    Why Choose Duitku?
                  </h3>
                  <p className="text-xl text-slate-600 dark:text-slate-300">
                    Everything you need to manage your finances effectively
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div className="text-center group">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-green-200 dark:bg-gradient-to-br dark:from-emerald-900/50 dark:to-green-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Easy to Use</h4>
                    <p className="text-slate-600 dark:text-slate-400">Intuitive interface designed for everyone</p>
                  </div>
                  
                  <div className="text-center group">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-200 dark:bg-gradient-to-br dark:from-blue-900/50 dark:to-cyan-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Smart Analytics</h4>
                    <p className="text-slate-600 dark:text-slate-400">Get insights into your spending habits</p>
                  </div>
                  
                  <div className="text-center group">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-200 dark:bg-gradient-to-br dark:from-purple-900/50 dark:to-indigo-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Secure</h4>
                    <p className="text-slate-600 dark:text-slate-400">Your financial data is always protected</p>
                  </div>
                  
                  <div className="text-center group">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-200 dark:bg-gradient-to-br dark:from-orange-900/50 dark:to-red-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Free</h4>
                    <p className="text-slate-600 dark:text-slate-400">No hidden fees or premium subscriptions</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Enhanced CTA */}
            <Card className="text-center border-0 shadow-2xl bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 dark:from-blue-900/30 dark:via-purple-900/30 dark:to-indigo-900/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 via-purple-100/20 to-indigo-100/20 dark:from-blue-800/10 dark:via-purple-800/10 dark:to-indigo-800/10"></div>
              <div className="relative p-12">
                <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Ready to take control of your finances?
                </h3>
                <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                  Create your free account and start tracking your money today. Join thousands of satisfied users!
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <Link href="/register">
                    <Button size="lg" className="w-full sm:w-auto h-16 px-10 text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
                      <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Get Started Free
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto h-16 px-10 text-lg font-semibold border-2 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      Already have an account? Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}