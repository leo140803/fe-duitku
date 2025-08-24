"use client";
import { useEffect, useState } from "react";
import Protected from "@/components/Protected";
import { useAuth } from "@/hooks/useAuth";
import { apiGet, apiPost } from "@/lib/api";
import { Card, Field, Title, Button, Input, Alert, Badge } from "@/components/UI";

interface Account { 
  id: string; 
  user_id: string; 
  name: string; 
  initial_balance: number;
  created_at?: string 
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

// Account Status Badge Component  
const AccountStatusBadge = ({ balance }: { balance: number }) => {
  if (balance > 100000) {
    return <Badge variant="success" className="text-xs">Healthy</Badge>;
  } else if (balance >= 0) {
    return <Badge variant="warning" className="text-xs">Low Balance</Badge>;
  } else {
    return <Badge variant="secondary" className="text-xs">Overdraft</Badge>;
  }
};

export default function AccountsPage() {
  const { session } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [name, setName] = useState("");
  const [initialBalance, setInitialBalance] = useState("");
  const [loading, setLoading] = useState(false);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function loadAccounts() {
    if (!session) return;
    
    setAccountsLoading(true);
    setError(null);
    
    try {
      const res = await apiGet<Account[]>("/accounts", session.access_token);
      setAccounts(res);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load accounts");
    } finally {
      setAccountsLoading(false);
    }
  }

  async function onCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    
    const balance = parseFloat(initialBalance);
    if (isNaN(balance)) {
      setError("Please enter a valid balance amount");
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      await apiPost(
        "/accounts", 
        { name, initial_balance: balance }, 
        session.access_token
      );
      
      // Show success message
      setSuccessMessage(`Account "${name}" created successfully!`);
      
      // Reload accounts data after successful creation
      await loadAccounts();
      
      // Reset form
      setName("");
      setInitialBalance("");
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (err: any) {
      setError(err?.message ?? "Failed to create account");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    loadAccounts(); 
    /* eslint-disable-next-line */ 
  }, [session]);

  const totalBalance = accounts.reduce((sum, account) => sum + account.initial_balance, 0);

  return (
    <Protected>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <Title>Accounts</Title>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your bank accounts and track your balances
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <Alert type="success" className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {successMessage}
          </Alert>
        )}

        {/* Add Account Form */}
        <Card>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Account
          </h2>
          
          <form onSubmit={onCreateAccount} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Account Name">
                <Input
                  placeholder="Enter account name (e.g., Bank BCA, Cash, Credit Card)"
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  disabled={loading}
                  required
                />
              </Field>
              
              <Field label="Initial Balance">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={initialBalance}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInitialBalance(e.target.value)}
                  disabled={loading}
                  required
                />
              </Field>
            </div>
            
            <Button 
              type="submit" 
              loading={loading}
              disabled={!name.trim() || !initialBalance.trim() || loading}
              className="w-full sm:w-auto flex items-center gap-2"
            >
              {loading && <LoadingSpinner size="sm" />}
              {loading ? "Adding Account..." : "Add Account"}
            </Button>
          </form>

          {error && (
            <Alert type="secondary" className="mt-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </Alert>
          )}
        </Card>

        {/* Accounts List */}
        <Card>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Your Accounts
            {accountsLoading && <LoadingSpinner size="sm" />}
          </h2>

          {accountsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading accounts...</p>
              </div>
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🏦</div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                No accounts yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Create your first account to start tracking your finances
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((account) => (
                <div 
                  key={account.id} 
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                        {account.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <AccountStatusBadge balance={account.initial_balance} />
                        {account.created_at && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(account.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(account.initial_balance)}
                      </div>
                    </div>
                    <div className="ml-4">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Summary Stats */}
        {accounts.length > 0 && !accountsLoading && (
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">
                  Total Accounts
                </h3>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {accounts.length}
                </p>
                <Badge variant="success" className="mt-2">
                  {accounts.length === 1 ? 'Single Account' : 'Multiple Accounts'}
                </Badge>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">
                  Total Balance
                </h3>
                <p className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(totalBalance)}
                </p>
                <Badge variant={totalBalance >= 0 ? "success" : "secondary"} className="mt-2">
                  {totalBalance >= 0 ? 'Positive Balance' : 'Negative Balance'}
                </Badge>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">
                  Average Balance
                </h3>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(accounts.length > 0 ? totalBalance / accounts.length : 0)}
                </p>
                <Badge variant="success" className="mt-2">
                  Per Account Average
                </Badge>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Protected>
  );
}