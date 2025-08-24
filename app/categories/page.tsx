"use client";
import { useEffect, useState } from "react";
import Protected from "@/components/Protected";
import { useAuth } from "@/hooks/useAuth";
import { apiGet, apiPost, apiPut, apiDelete, } from "@/lib/api";
import { Card, Field, Title, Button, Input, Alert, Badge } from "@/components/UI";

interface Category { 
  id: string; 
  user_id: string; 
  name: string; 
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

// Category Status Badge Component  
const CategoryStatusBadge = ({ category }: { category: Category }) => {
  // Check if category name indicates expense or income type
  const expenseKeywords = ['food', 'transport', 'entertainment', 'shopping', 'bills', 'rent', 'utilities'];
  const incomeKeywords = ['salary', 'income', 'bonus', 'freelance', 'investment', 'dividend'];
  
  const categoryLower = category.name.toLowerCase();
  
  if (incomeKeywords.some(keyword => categoryLower.includes(keyword))) {
    return <Badge variant="success" className="text-xs">Income</Badge>;
  } else if (expenseKeywords.some(keyword => categoryLower.includes(keyword))) {
    return <Badge variant="warning" className="text-xs">Expense</Badge>;
  } else {
    return <Badge variant="success" className="text-xs">General</Badge>;
  }
};

// Category Icons based on category type
const getCategoryIcon = (categoryName: string) => {
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
    return "📂";
  }
};

export default function CategoriesPage() {
  const { session } = useAuth();
  const [items, setItems] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  async function onUpdate(id: string) {
    if (!session || !editName.trim()) return;
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
  
    try {
      await apiPut(`/categories/${id}`, { name: editName.trim() }, session.access_token);
      setSuccessMessage(`Category updated successfully!`);
      await load();
      setEditingId(null);
      setEditName("");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err?.message ?? "Failed to update category");
    } finally {
      setLoading(false);
    }
  }
  
  async function onDelete(id: string, categoryName: string) {
    if (!session) return;
    
    // Create custom confirmation modal
    const confirmDelete = () => {
      return new Promise<boolean>((resolve) => {
        // Create modal elements
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        
        const modal = document.createElement('div');
        modal.className = 'bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6';
        
        modal.innerHTML = `
          <div class="flex items-center gap-3 mb-4">
            <div class="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Delete Category</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">This action cannot be undone</p>
            </div>
          </div>
          
          <div class="mb-6">
            <p class="text-gray-700 dark:text-gray-300 mb-3">
              Are you sure you want to delete the category:
            </p>
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border">
              <div class="flex items-center gap-2">
                <span class="text-lg">${getCategoryIcon(categoryName)}</span>
                <span class="font-medium text-gray-900 dark:text-gray-100">${categoryName}</span>
              </div>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-3">
              ⚠️ This may affect related transactions and cannot be undone.
            </p>
          </div>
          
          <div class="flex flex-col sm:flex-row gap-3 sm:gap-2 sm:justify-end">
            <button id="cancelBtn" class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium">
              Cancel
            </button>
            <button id="confirmBtn" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Category
            </button>
          </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Add event listeners
        const cancelBtn = modal.querySelector('#cancelBtn');
        const confirmBtn = modal.querySelector('#confirmBtn');
        
        const cleanup = () => {
          document.body.removeChild(overlay);
        };
        
        cancelBtn?.addEventListener('click', () => {
          cleanup();
          resolve(false);
        });
        
        confirmBtn?.addEventListener('click', () => {
          cleanup();
          resolve(true);
        });
        
        // Close on overlay click
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) {
            cleanup();
            resolve(false);
          }
        });
        
        // Close on escape key
        const handleEscape = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
            cleanup();
            document.removeEventListener('keydown', handleEscape);
            resolve(false);
          }
        };
        document.addEventListener('keydown', handleEscape);
      });
    };
    
    const isConfirmed = await confirmDelete();
    if (!isConfirmed) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);
  
    try {
      await apiDelete(`/categories/${id}`, session.access_token);
      setSuccessMessage(`Category "${categoryName}" deleted successfully!`);
      await load();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err?.message ?? "Failed to delete category");
    } finally {
      setLoading(false);
    }
  }
  
  // Handle edit cancellation
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  // Handle edit start
  const handleStartEdit = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
  };

  async function load() {
    if (!session) return;
    
    setItemsLoading(true);
    setError(null);
    
    try {
      const res = await apiGet<Category[]>("/categories", session.access_token);
      setItems(res);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load categories");
    } finally {
      setItemsLoading(false);
    }
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      await apiPost("/categories", { name }, session.access_token);
      
      // Show success message
      setSuccessMessage(`Category "${name}" created successfully!`);
      
      // Reload categories data after successful creation
      await load();
      
      // Reset form
      setName("");
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (err: any) {
      setError(err?.message ?? "Failed to create category");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    load(); 
    /* eslint-disable-next-line */ 
  }, [session]);

  // Calculate category statistics
  const recentCategories = items.filter(category => {
    if (!category.created_at) return false;
    const daysDiff = (new Date().getTime() - new Date(category.created_at).getTime()) / (1000 * 3600 * 24);
    return daysDiff <= 7;
  }).length;

  return (
    <Protected>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <Title>Categories</Title>
          <p className="text-gray-600 dark:text-gray-400">
            Organize your transactions with custom categories
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

        {/* Add Category Form */}
        <Card>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Category
          </h2>
          
          <form onSubmit={onCreate} className="space-y-4">
            <Field label="Category Name">
              <Input
                placeholder="Enter category name (e.g., Food, Transportation, Entertainment)"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                disabled={loading}
                required
              />
            </Field>
            
            <Button 
              type="submit" 
              loading={loading}
              disabled={!name.trim() || loading}
              className="w-full sm:w-auto flex items-center gap-2"
            >
              {loading && <LoadingSpinner size="sm" />}
              {loading ? "Adding Category..." : "Add Category"}
            </Button>
          </form>

          {error && (
            <Alert type="error" className="mt-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </Alert>
          )}
        </Card>

        {/* Categories List */}
        <Card>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Your Categories
            {itemsLoading && <LoadingSpinner size="sm" />}
          </h2>

          {itemsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading categories...</p>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📂</div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                No categories yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Create your first category to start organizing your transactions
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((category) => (
                <div 
                  key={category.id} 
                  className={`p-4 border rounded-lg transition-all duration-200 ${
                    editingId === category.id 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md' 
                      : 'hover:shadow-sm hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {editingId === category.id ? (
                    // Edit Mode - Full width form
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        onUpdate(category.id);
                      }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl flex-shrink-0">{getCategoryIcon(category.name)}</span>
                        <Input
                          value={editName}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)}
                          className="flex-1"
                          placeholder="Enter category name"
                          disabled={loading}
                          required
                          autoFocus
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button 
                          type="submit" 
                          loading={loading}
                          disabled={!editName.trim() || loading}
                          className="flex items-center justify-center gap-2 flex-1 sm:flex-none"
                        >
                          {loading ? (
                            <>
                              <LoadingSpinner size="sm" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Save Changes
                            </>
                          )}
                        </Button>
                        <Button 
                          type="button" 
                          variant="primary" 
                          onClick={handleCancelEdit}
                          disabled={loading}
                          className="flex items-center justify-center gap-2 flex-1 sm:flex-none"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    // Normal Mode - Clean layout
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-xl flex-shrink-0">{getCategoryIcon(category.name)}</span>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {category.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <CategoryStatusBadge category={category} />
                            {category.created_at && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(category.created_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 flex-shrink-0">
                        <Button 
                          size="sm" 
                          variant="primary" 
                          onClick={() => handleStartEdit(category)}
                          disabled={loading}
                          className="flex items-center gap-1.5 px-3 py-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Enhanced Stats */}
        {items.length > 0 && !itemsLoading && (
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">
                  Total Categories
                </h3>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {items.length}
                </p>
                <Badge variant="success" className="mt-2">
                  {items.length === 1 ? 'Single Category' : 'Multiple Categories'}
                </Badge>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">
                  Recent Categories
                </h3>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {recentCategories}
                </p>
                <Badge variant={recentCategories > 0 ? "success" : "default"} className="mt-2">
                  {recentCategories > 0 ? 'Recently Added' : 'No Recent Additions'}
                </Badge>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">
                  Organization Level
                </h3>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {items.length >= 10 ? 'Expert' : items.length >= 5 ? 'Good' : 'Basic'}
                </p>
                <Badge 
                  variant={items.length >= 10 ? "success" : items.length >= 5 ? "warning" : "default"} 
                  className="mt-2"
                >
                  {items.length >= 10 ? 'Well Organized' : items.length >= 5 ? 'Getting There' : 'Just Started'}
                </Badge>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Protected>
  );
}