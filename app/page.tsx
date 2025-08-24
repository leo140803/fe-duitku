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
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <Title>Duitku Dashboard</Title>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Take control of your finances with comprehensive analytics and insights
        </p>
      </div>

      {session ? (
        <div className="space-y-6">
          {/* Welcome Card */}
          <Card className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {session.email.charAt(0).toUpperCase()}
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">Welcome back!</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Logged in as <span className="font-medium text-gray-800 dark:text-gray-200">{session.email}</span>
            </p>
          </Card>

          {loading ? (
            <Card>
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <LoadingSpinner size="lg" />
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your financial data...</p>
                </div>
              </div>
            </Card>
          ) : (
            <>
              {/* Financial Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="text-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                  <div className="text-3xl mb-2">💰</div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Income</h3>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    }).format(totalIncome)}
                  </p>
                  <Badge variant="success" className="mt-2 text-xs">
                    {transactions.filter(t => t.type === "INCOME").length} transactions
                  </Badge>
                </Card>

                <Card className="text-center bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200 dark:border-red-800">
                  <div className="text-3xl mb-2">💸</div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Expenses</h3>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">
                    {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    }).format(totalExpense)}
                  </p>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {transactions.filter(t => t.type === "EXPENSE").length} transactions
                  </Badge>
                </Card>

                <Card className={`text-center bg-gradient-to-br ${netBalance >= 0 ? 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800' : 'from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800'}`}>
                  <div className="text-3xl mb-2">{netBalance >= 0 ? '📈' : '📉'}</div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Net Balance</h3>
                  <p className={`text-xl font-bold ${netBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                    {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    }).format(netBalance)}
                  </p>
                  <Badge variant={netBalance >= 0 ? "default" : "warning"} className="mt-2 text-xs">
                    {netBalance >= 0 ? 'Surplus' : 'Deficit'}
                  </Badge>
                </Card>

                <Card className="text-center bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800">
                  <div className="text-3xl mb-2">🏦</div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Accounts</h3>
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {accounts.length}
                  </p>
                  <Badge variant="default" className="mt-2 text-xs">
                    {categories.length} categories
                  </Badge>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Trend Chart */}
                <Card>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Monthly Trend (6 Months)
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                      <Tooltip 
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
                      <Area type="monotone" dataKey="income" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="expense" stackId="2" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>

                {/* Weekly Activity Chart */}
                <Card>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Weekly Activity (7 Days)
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                      <Tooltip 
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
                      <Bar dataKey="income" fill="#10B981" />
                      <Bar dataKey="expense" fill="#EF4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                {/* Expense Categories Pie Chart */}
                {categoryData.length > 0 && (
                  <Card>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                      </svg>
                      Expense Categories
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${name}: ${percentage}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [
                          new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                          }).format(value),
                          'Amount'
                        ]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>
                )}

                {/* Account Balances */}
                <Card>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Account Balances
                  </h3>
                  <div className="space-y-3">
                    {accountBalances.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-8">No accounts found</p>
                    ) : (
                      accountBalances.map((account) => (
                        <div key={account.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-800 dark:text-gray-200">{account.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {account.transactionCount} transactions
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${account.currentBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {new Intl.NumberFormat('id-ID', {
                                style: 'currency',
                                currency: 'IDR',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                              }).format(account.currentBalance)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>

              {/* Recent Transactions */}
              <Card>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Recent Transactions
                  <Badge variant="default" className="text-xs">{recentTransactions.length}</Badge>
                </h3>
                <div className="space-y-2">
                  {recentTransactions.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">No transactions found</p>
                  ) : (
                    recentTransactions.map((transaction) => {
                      const account = accounts.find(a => a.id === transaction.account_id);
                      const category = categories.find(c => c.id === transaction.category_id);
                      
                      return (
                        <div key={transaction.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="text-lg">
                              {transaction.type === "INCOME" ? "💰" : "💸"}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-800 dark:text-gray-200">
                                {transaction.description || "No description"}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {account?.name} • {category?.name || "Uncategorized"} • {new Date(transaction.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${transaction.type === "INCOME" ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
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
                      );
                    })
                  )}
                  {recentTransactions.length > 0 && (
                    <div className="text-center pt-4">
                      <Link href="/transactions">
                        <Button variant="outline" size="sm">
                          View All Transactions
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </Card>

              {/* Quick Actions */}
              <Card>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Link href="/transactions">
                    <Button variant="outline" className="w-full">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      Add Transaction
                    </Button>
                  </Link>
                  <Link href="/categories">
                    <Button variant="outline" className="w-full">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Manage Categories
                    </Button>
                  </Link>
                  <Link href="/accounts">
                    <Button variant="outline" className="w-full">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      View Accounts
                    </Button>
                  </Link>
                  <Link href="/transactions">
                    <Button variant="outline" className="w-full">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      View Analytics
                    </Button>
                  </Link>
                </div>
              </Card>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                  <Link key={index} href={feature.href}>
                    <Card className="h-full hover:scale-105 transition-transform duration-200 cursor-pointer group">
                      <div className="text-center space-y-4">
                        <div className="text-4xl">{feature.icon}</div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 transition-colors">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
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
        <div className="space-y-6">
          {/* Hero Section */}
          <Card className="text-center">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-6xl mb-4">💳</div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                Start Managing Your Money Today
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Join thousands of users who are already taking control of their finances with Duitku
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/login">
                  <Button size="lg" className="w-full sm:w-auto">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Create Account
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Features Demo Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-lg font-semibold mb-4">📊 Analytics Dashboard</h3>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">Rp 15M</div>
                    <div className="text-xs text-gray-600">Income</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">Rp 10M</div>
                    <div className="text-xs text-gray-600">Expenses</div>
                  </div>
                </div>
                <div className="h-16 bg-gradient-to-r from-green-200 to-blue-200 dark:from-green-800 to-blue-800 rounded opacity-60"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Visualize your financial trends with interactive charts
                </p>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold mb-4">🏦 Smart Categories</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div>🍽️</div>
                    <span className="text-sm font-medium">Food & Dining</span>
                  </div>
                  <div className="text-sm font-bold text-red-600">Rp 2.5M</div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div>🚗</div>
                    <span className="text-sm font-medium">Transportation</span>
                  </div>
                  <div className="text-sm font-bold text-red-600">Rp 1.8M</div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div>🎬</div>
                    <span className="text-sm font-medium">Entertainment</span>
                  </div>
                  <div className="text-sm font-bold text-red-600">Rp 800K</div>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                Automatically categorize and track your spending patterns
              </p>
            </Card>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>

          {/* Benefits Section */}
          <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                Why Choose Duitku?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Everything you need to manage your finances effectively
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">Easy to Use</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Intuitive interface designed for everyone</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">Smart Analytics</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Get insights into your spending habits</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">Secure</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Your financial data is always protected</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">Free</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">No hidden fees or premium subscriptions</p>
              </div>
            </div>
          </Card>

          {/* CTA */}
          <Card className="text-center bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
              Ready to take control of your finances?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your free account and start tracking your money today. Join thousands of satisfied users!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Get Started Free
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Already have an account? Sign In
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}