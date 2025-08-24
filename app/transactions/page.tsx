"use client";
import { useEffect, useState } from "react";
import Protected from "@/components/Protected";
import { useAuth } from "@/hooks/useAuth";
import { apiGet, apiPost, apiPut, apiDelete, } from "@/lib/api";
import { Card, Field, Title, Button, Input, Alert, Badge } from "@/components/UI";
import * as XLSX from "xlsx";

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
  created_at?: string 
}

interface Account { 
  id: string; 
  user_id: string; 
  name: string; 
  initial_balance: number;
  created_at?: string 
}

interface Category { 
  id: string; 
  user_id: string; 
  name: string; 
  created_at?: string 
}

// Filter interface
interface TransactionFilters {
  dateFrom: string;
  dateTo: string;
  accountId: string;
  categoryId: string;
  type: string; // "" | "INCOME" | "EXPENSE"
  minAmount: string;
  maxAmount: string;
  searchQuery: string;
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

// Transaction Status Badge Component  
const TransactionStatusBadge = ({ transaction }: { transaction: Transaction }) => {
  if (transaction.amount > 1000000) {
    return <Badge variant={transaction.type === "INCOME" ? "success" : "error"} className="text-xs">
      {transaction.type === "INCOME" ? "Large Income" : "Large Expense"}
    </Badge>;
  } else if (transaction.amount > 100000) {
    return <Badge variant={transaction.type === "INCOME" ? "success" : "warning"} className="text-xs">
      {transaction.type === "INCOME" ? "Medium Income" : "Medium Expense"}
    </Badge>;
  } else {
    return <Badge variant={transaction.type === "INCOME" ? "success" : "default"} className="text-xs">
      {transaction.type === "INCOME" ? "Small Income" : "Small Expense"}
    </Badge>;
  }
};

// Transaction Icons based on type and amount
const getTransactionIcon = (transaction: Transaction) => {
  if (transaction.type === "INCOME") {
    return transaction.amount > 1000000 ? "💎" : transaction.amount > 100000 ? "💰" : "💵";
  } else {
    return transaction.amount > 1000000 ? "💸" : transaction.amount > 100000 ? "🛒" : "💳";
  }
};



// Get category icon
const getCategoryIcon = (categoryName?: string) => {
  if (!categoryName) return "📂";
  
  const name = categoryName.toLowerCase();
  
  if (name.includes('food') || name.includes('restaurant') || name.includes('dining')) {
    return "🍽️";
  } else if (name.includes('transport') || name.includes('travel') || name.includes('car') || name.includes('gas')) {
    return "🚗";
  } else if (name.includes('entertainment') || name.includes('movie') || name.includes('game')) {
    return "🎬";
  } else if (name.includes('shopping') || name.includes('clothes') || name.includes('fashion')) {
    return "🛒";
  } else if (name.includes('health') || name.includes('medical') || name.includes('doctor')) {
    return "🏥";
  } else if (name.includes('education') || name.includes('course') || name.includes('book')) {
    return "📚";
  } else if (name.includes('salary') || name.includes('income') || name.includes('bonus')) {
    return "💰";
  } else if (name.includes('bill') || name.includes('utilities') || name.includes('rent')) {
    return "🧾";
  } else {
    return "📊";
  }
};

export default function TransactionsPage() {
  const { session } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Form states
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});
  
  async function onUpdate(id: string) {
    if (!session) return;
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
  
    try {
      await apiPut(`/transactions/${id}`, {
        ...editForm,
        amount: Number(editForm.amount),
      }, session.access_token);
  
      setSuccessMessage("Transaction updated successfully!");
      await loadData();
      setEditingId(null);
      setEditForm({});
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err?.message ?? "Failed to update transaction");
    } finally {
      setLoading(false);
    }
  }
  
  async function onDelete(id: string, description?: string) {
    if (!session) return;
  
    if (!confirm(`Are you sure you want to delete transaction "${description || id}" ?`)) return;
  
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
  
    try {
      await apiDelete(`/transactions/${id}`, session.access_token);
      setSuccessMessage("Transaction deleted successfully!");
      await loadData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err?.message ?? "Failed to delete transaction");
    } finally {
      setLoading(false);
    }
  }
  
  // Filter states
  const [filters, setFilters] = useState<TransactionFilters>({
    dateFrom: "",
    dateTo: "",
    accountId: "",
    categoryId: "",
    type: "",
    minAmount: "",
    maxAmount: "",
    searchQuery: ""
  });
  const [showFilters, setShowFilters] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter transactions based on current filters
  const filteredTransactions = transactions.filter(transaction => {
    // Date range filter
    if (filters.dateFrom && transaction.date < filters.dateFrom) return false;
    if (filters.dateTo && transaction.date > filters.dateTo) return false;
    
    // Account filter
    if (filters.accountId && transaction.account_id !== filters.accountId) return false;
    
    // Category filter
    if (filters.categoryId) {
      if (filters.categoryId === "uncategorized" && transaction.category_id) return false;
      if (filters.categoryId !== "uncategorized" && transaction.category_id !== filters.categoryId) return false;
    }
    
    // Type filter
    if (filters.type && transaction.type !== filters.type) return false;
    
    // Amount range filter
    const minAmount = parseFloat(filters.minAmount);
    const maxAmount = parseFloat(filters.maxAmount);
    if (!isNaN(minAmount) && transaction.amount < minAmount) return false;
    if (!isNaN(maxAmount) && transaction.amount > maxAmount) return false;
    
    // Search query filter (description)
    if (filters.searchQuery) {
      const searchLower = filters.searchQuery.toLowerCase();
      const description = (transaction.description || "").toLowerCase();
      const accountName = getAccountName(transaction.account_id).toLowerCase();
      const categoryName = getCategoryName(transaction.category_id).toLowerCase();
      
      if (!description.includes(searchLower) && 
          !accountName.includes(searchLower) && 
          !categoryName.includes(searchLower)) {
        return false;
      }
    }
    
    return true;
  });

  const exportToExcel = () => {
    // Data yang diekspor: gunakan filteredTransactions agar sesuai dengan filter aktif
    const data = filteredTransactions.map((t) => ({
      Date: new Date(t.date).toLocaleDateString(),
      Description: t.description || "No description",
      Account: getAccountName(t.account_id),
      Category: getCategoryName(t.category_id),
      Type: t.type,
      Amount: t.amount,
    }));
  
    // Buat worksheet dan workbook
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
  
    // Simpan sebagai file Excel
    XLSX.writeFile(wb, "transactions.xlsx");
  };

  // Calculate stats for filtered data
  const filteredTotalIncome = filteredTransactions
    .filter(t => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);
    
  const filteredTotalExpense = filteredTransactions
    .filter(t => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);
    
  const filteredNetBalance = filteredTotalIncome - filteredTotalExpense;

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(value => value !== "");

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      accountId: "",
      categoryId: "",
      type: "",
      minAmount: "",
      maxAmount: "",
      searchQuery: ""
    });
  };

  async function loadData() {
    if (!session) return;
    
    setDataLoading(true);
    setError(null);
    
    try {
      const [transactionsRes, accountsRes, categoriesRes] = await Promise.all([
        apiGet<Transaction[]>("/transactions", session.access_token),
        apiGet<Account[]>("/accounts", session.access_token),
        apiGet<Category[]>("/categories", session.access_token)
      ]);
      
      setTransactions(transactionsRes);
      setAccounts(accountsRes);
      setCategories(categoriesRes);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load data");
    } finally {
      setDataLoading(false);
    }
  }

  async function onCreateTransaction(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    
    if (!accountId) {
      setError("Please select an account");
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const transactionData = {
        account_id: accountId,
        category_id: categoryId || null,
        date,
        description: description || null,
        amount: amountValue,
        type
      };
      
      await apiPost(
        "/transactions", 
        transactionData, 
        session.access_token
      );
      
      // Show success message
      const transactionDesc = description || `${type.toLowerCase()} transaction`;
      setSuccessMessage(`Transaction "${transactionDesc}" added successfully!`);
      
      // Reload all data after successful creation
      await loadData();
      
      // Reset form
      setAccountId("");
      setCategoryId("");
      setDate(new Date().toISOString().split('T')[0]);
      setDescription("");
      setAmount("");
      setType("EXPENSE");
      
      // Clear success message after 4 seconds
      setTimeout(() => setSuccessMessage(null), 4000);
      
    } catch (err: any) {
      setError(err?.message ?? "Failed to create transaction");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    loadData(); 
    /* eslint-disable-next-line */ 
  }, [session]);

  const totalIncome = transactions
    .filter(t => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpense = transactions
    .filter(t => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);
    
  const netBalance = totalIncome - totalExpense;

  // Calculate recent transactions (last 7 days)
  const recentTransactions = transactions.filter(transaction => {
    const daysDiff = (new Date().getTime() - new Date(transaction.date).getTime()) / (1000 * 3600 * 24);
    return daysDiff <= 7;
  }).length;

  const getAccountName = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    return account?.name || "Unknown Account";
  };

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return "Uncategorized";
    const category = categories.find(c => c.id === categoryId);
    return category?.name || "Unknown Category";
  };

  // Sort transactions by date (newest first)
  const sortedTransactions = [...filteredTransactions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Protected>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <Title>Transactions</Title>
          <p className="text-gray-600 dark:text-gray-400">
            Track your income and expenses with detailed records
          </p>
        </div>

         {/* Export Button */}
         {!dataLoading && transactions.length > 0 && (
          <div className="flex justify-end">
              <Button variant="primary" size="sm" onClick={exportToExcel} className="flex items-center gap-1">
                📤 Export to Excel
              </Button>
            </div>
          )}


        {/* Success Message */}
        {successMessage && (
          <Alert type="success" className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {successMessage}
          </Alert>
        )}

        {/* Warning if no accounts/categories */}
        {!dataLoading && (accounts.length === 0 || categories.length === 0) && (
          <Alert type="warning" className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {accounts.length === 0 ? "Please create an account first before adding transactions." : 
             "Consider creating categories to better organize your transactions."}
          </Alert>
        )}

        {/* Add Transaction Form */}
        <Card>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Transaction
            {loading && <LoadingSpinner size="sm" />}
          </h2>
          
          {dataLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading form data...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={onCreateTransaction} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Account">
                  <select 
                    className="input"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    disabled={loading || accounts.length === 0}
                    required
                  >
                    <option value="">Select an account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </Field>
                
                <Field label="Category (Optional)">
                  <select 
                    className="input"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Date">
                  <Input
                    type="date"
                    value={date}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
                    disabled={loading}
                    required
                  />
                </Field>
                
                <Field label="Amount">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                    disabled={loading}
                    required
                  />
                </Field>
                
                <Field label="Type">
                  <select 
                    className="input"
                    value={type}
                    onChange={(e) => setType(e.target.value as "INCOME" | "EXPENSE")}
                    disabled={loading}
                    required
                  >
                    <option value="EXPENSE">Expense</option>
                    <option value="INCOME">Income</option>
                  </select>
                </Field>
              </div>
              
              <Field label="Description (Optional)">
                <Input
                  placeholder="Enter transaction description"
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
                  disabled={loading}
                />
              </Field>
              
              <Button 
                type="submit" 
                loading={loading}
                disabled={!accountId || !amount.trim() || !date || loading || accounts.length === 0}
                className="w-full sm:w-auto flex items-center gap-2"
              >
                {loading && <LoadingSpinner size="sm" />}
                {loading ? "Adding Transaction..." : "Add Transaction"}
              </Button>
            </form>
          )}

          {error && (
            <Alert type="error" className="mt-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </Alert>
          )}
        </Card>

        {/* Filters Section */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {hasActiveFilters && (
                <Badge variant="primary" className="text-xs">
                  {Object.values(filters).filter(v => v !== "").length} Active
                </Badge>
              )}
            </h2>
            <div className="flex gap-2">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1"
              >
                {showFilters ? "Hide" : "Show"} Filters
                <svg 
                  className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
              {/* Search and Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Search">
                  <Input
                    placeholder="Search description, account, or category..."
                    value={filters.searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                  />
                </Field>
                <Field label="Date From">
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  />
                </Field>
                <Field label="Date To">
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  />
                </Field>
              </div>

              {/* Account, Category, Type */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Account">
                  <select 
                    className="input"
                    value={filters.accountId}
                    onChange={(e) => setFilters(prev => ({ ...prev, accountId: e.target.value }))}
                  >
                    <option value="">All accounts</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </Field>
                
                <Field label="Category">
                  <select 
                    className="input"
                    value={filters.categoryId}
                    onChange={(e) => setFilters(prev => ({ ...prev, categoryId: e.target.value }))}
                  >
                    <option value="">All categories</option>
                    <option value="uncategorized">Uncategorized</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </Field>
                
                <Field label="Type">
                  <select 
                    className="input"
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="">All types</option>
                    <option value="INCOME">Income</option>
                    <option value="EXPENSE">Expense</option>
                  </select>
                </Field>
              </div>

              {/* Amount Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Minimum Amount">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={filters.minAmount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                  />
                </Field>
                <Field label="Maximum Amount">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={filters.maxAmount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                  />
                </Field>
              </div>
            </div>
          )}
        </Card>

        {/* Summary Stats - Updated to show filtered data */}
        {!dataLoading && (
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {hasActiveFilters ? "Filtered Statistics" : "Overall Statistics"}
              </h3>
              {hasActiveFilters && (
                <Badge variant="primary" className="text-xs">
                  Showing {filteredTransactions.length} of {transactions.length} transactions
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div>
                <h4 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">
                  Total Transactions
                </h4>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {filteredTransactions.length}
                </p>
                <Badge variant="primary" className="mt-2">
                  {hasActiveFilters ? `${filteredTransactions.length} Filtered` : `${transactions.length} Total`}
                </Badge>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">
                  Total Income
                </h4>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(filteredTotalIncome)}
                </p>
                <Badge variant="success" className="mt-2">
                  {filteredTransactions.filter(t => t.type === "INCOME").length} Income
                </Badge>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">
                  Total Expenses
                </h4>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(filteredTotalExpense)}
                </p>
                <Badge variant="error" className="mt-2">
                  {filteredTransactions.filter(t => t.type === "EXPENSE").length} Expenses
                </Badge>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">
                  Net Balance
                </h4>
                <p className={`text-2xl font-bold ${filteredNetBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(filteredNetBalance)}
                </p>
                <Badge variant={filteredNetBalance >= 0 ? "success" : "error"} className="mt-2">
                  {filteredNetBalance >= 0 ? 'Positive' : 'Negative'}
                </Badge>
              </div>
            </div>
          </Card>
        )}

        {/* Transactions List */}
        <Card>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Transaction History
            {dataLoading && <LoadingSpinner size="sm" />}
            {hasActiveFilters && !dataLoading && (
              <Badge variant="primary" className="text-xs">
                Filtered Results
              </Badge>
            )}
          </h2>

          {dataLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading transactions...</p>
              </div>
            </div>
          ) : sortedTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">
                {hasActiveFilters ? "🔍" : "💰"}
              </div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                {hasActiveFilters ? "No transactions match your filters" : "No transactions yet"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {hasActiveFilters ? 
                  "Try adjusting your filters to see more results" : 
                  "Add your first transaction to start tracking your finances"}
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="mt-3 flex items-center gap-1 mx-auto"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear All Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Results summary */}
              {hasActiveFilters && (
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Showing <strong>{sortedTransactions.length}</strong> of <strong>{transactions.length}</strong> transactions
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={clearFilters}
                    className="text-blue-800 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-800/30"
                  >
                    Clear Filters
                  </Button>
                </div>
              )}

              {sortedTransactions.map((transaction) => (
                <div 
                  key={transaction.id} 
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-200 overflow-hidden"
                >
                  {editingId === transaction.id ? (
                    <div className="p-6">
                      <form
                        onSubmit={(e) => { e.preventDefault(); onUpdate(transaction.id); }}
                        className="space-y-4"
                      >
                        {/* Account & Category Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Field label="Account">
                            <select
                              className="input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                              value={editForm.account_id || transaction.account_id}
                              onChange={(e) => setEditForm({ ...editForm, account_id: e.target.value })}
                              required
                            >
                              <option value="">Select account</option>
                              {accounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                              ))}
                            </select>
                          </Field>

                          <Field label="Category">
                            <select
                              className="input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                              value={editForm.category_id || transaction.category_id || ""}
                              onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}
                            >
                              <option value="">Uncategorized</option>
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                            </select>
                          </Field>
                        </div>

                        {/* Date, Amount & Type Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Field label="Date">
                            <Input
                              type="date"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                              value={editForm.date || transaction.date}
                              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                              required
                            />
                          </Field>
                          <Field label="Amount">
                            <Input
                              type="number"
                              step="0.01"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                              value={editForm.amount ?? transaction.amount}
                              onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                              required
                            />
                          </Field>
                          <Field label="Type">
                            <select
                              className="input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                              value={editForm.type || transaction.type}
                              onChange={(e) => setEditForm({ ...editForm, type: e.target.value as "INCOME" | "EXPENSE" })}
                              required
                            >
                              <option value="EXPENSE">Expense</option>
                              <option value="INCOME">Income</option>
                            </select>
                          </Field>
                        </div>

                        {/* Description */}
                        <Field label="Description">
                          <Input
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            value={editForm.description ?? transaction.description ?? ""}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            placeholder="Enter transaction description..."
                          />
                        </Field>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 pt-2">
                          <Button 
                            type="button" 
                            variant="primary" 
                            onClick={() => setEditingId(null)}
                            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            loading={loading}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                          >
                            Save Changes
                          </Button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        {/* Left Content */}
                        <div className="flex-1 min-w-0">
                          {/* Main Info Row */}
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-2xl flex-shrink-0">{getTransactionIcon(transaction)}</span>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg leading-tight">
                                {transaction.description || "No description"}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge 
                                  variant={transaction.type === "INCOME" ? "success" : "error"} 
                                  className="text-xs font-medium px-2 py-1"
                                >
                                  {transaction.type}
                                </Badge>
                                <TransactionStatusBadge transaction={transaction} />
                              </div>
                            </div>
                          </div>

                          {/* Details Row */}
                          <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>{new Date(transaction.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                              </svg>
                              <span className="truncate">{getAccountName(transaction.account_id)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>{getCategoryIcon(getCategoryName(transaction.category_id))}</span>
                              <span className="truncate">{getCategoryName(transaction.category_id)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right Content */}
                        <div className="flex flex-col items-end gap-3 flex-shrink-0">
                          {/* Amount */}
                          <div className={`text-2xl font-bold ${
                            transaction.type === "INCOME" 
                              ? 'text-emerald-600 dark:text-emerald-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {transaction.type === "INCOME" ? "+" : "-"}
                            {new Intl.NumberFormat('id-ID', {
                              style: 'currency', 
                              currency: 'IDR',
                              minimumFractionDigits: 0, 
                              maximumFractionDigits: 0
                            }).format(transaction.amount)}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="error"
                              onClick={() => onDelete(transaction.id, transaction.description)}
                              className="px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md transition-colors text-sm font-medium"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}


              {/* Load more indicator if showing filtered results */}
              {hasActiveFilters && sortedTransactions.length > 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    End of filtered results • {transactions.length - sortedTransactions.length} more transactions hidden
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Quick Filter Shortcuts */}
        {!dataLoading && transactions.length > 0 && (
          <Card>
            <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Quick Filters
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, type: "INCOME" }))}
                className="flex items-center gap-1"
              >
                💰 Income Only
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, type: "EXPENSE" }))}
                className="flex items-center gap-1"
              >
                💸 Expenses Only
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                  setFilters(prev => ({ 
                    ...prev, 
                    dateFrom: lastWeek.toISOString().split('T')[0],
                    dateTo: today.toISOString().split('T')[0]
                  }));
                }}
                className="flex items-center gap-1"
              >
                📅 Last 7 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
                  setFilters(prev => ({ 
                    ...prev, 
                    dateFrom: lastMonth.toISOString().split('T')[0],
                    dateTo: today.toISOString().split('T')[0]
                  }));
                }}
                className="flex items-center gap-1"
              >
                📅 Last 30 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, minAmount: "100000" }))}
                className="flex items-center gap-1"
              >
                💎 Large Amounts
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, categoryId: "uncategorized" }))}
                className="flex items-center gap-1"
              >
                📂 Uncategorized
              </Button>
            </div>
          </Card>
        )}
      </div>
    </Protected>
  );
}