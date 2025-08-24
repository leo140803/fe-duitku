"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export function Card({ children, className = "", ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) {
    return (
        <div 
            className={`card p-6 md:p-8 fade-in ${className}`} 
            {...props}
        >
            {children}
        </div>
    );
}

export function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
    return (
        <div className="mb-6">
            <label className="label">{label}</label>
            {children}
            {error && <div className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
            </div>}
        </div>
    );
}

export function Title({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <h1 className={`text-3xl md:text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent ${className}`}>
            {children}
        </h1>
    );
}

export function Subtitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <h2 className={`text-xl md:text-2xl font-semibold mb-6 text-gray-700 dark:text-gray-300 ${className}`}>
            {children}
        </h2>
    );
}

export function Button({ 
    children, 
    variant = "primary", 
    size = "default",
    className = "", 
    loading = false,
    ...props 
}: { 
    children: React.ReactNode; 
    variant?: "primary" | "secondary" | "outline" | "destructive";
    size?: "sm" | "default" | "lg";
    className?: string;
    loading?: boolean;
    [key: string]: any;
}) {
    const baseClasses = "btn font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
    
    const variantClasses = {
        primary: "btn",
        secondary: "btn-secondary",
        outline: "btn-outline",
        destructive: "btn-destructive"
    };
    
    const sizeClasses = {
        sm: "px-3 py-2 text-sm",
        default: "px-4 py-2",
        lg: "px-6 py-3 text-lg"
    };
    
    return (
        <button 
            className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
            disabled={loading}
            {...props}
        >
            {loading && <span className="spinner mr-2"></span>}
            {children}
        </button>
    );
}

export function Input({ 
    className = "", 
    error,
    ...props 
}: { 
    className?: string; 
    error?: string;
    [key: string]: any;
}) {
    return (
        <input 
            className={`input ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''} ${className}`}
            {...props}
        />
    );
}

export function Badge({ 
    children, 
    variant = "default",
    className = "" 
}: { 
    children: React.ReactNode; 
    variant?: "default" | "success" | "warning" | "error";
    className?: string;
}) {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    const variantClasses = {
        default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
        success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    };
    
    return (
        <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
            {children}
        </span>
    );
}

export function Divider({ className = "" }: { className?: string }) {
    return (
        <div className={`border-t border-gray-200 dark:border-gray-700 my-6 ${className}`}></div>
    );
}

export function LoadingSpinner({ size = "default", className = "" }: { size?: "sm" | "default" | "lg"; className?: string }) {
    const sizeClasses = {
        sm: "w-4 h-4",
        default: "w-6 h-6",
        lg: "w-8 h-8"
    };
    
    return (
        <div className={`flex justify-center items-center ${className}`}>
            <div className={`spinner ${sizeClasses[size]}`}></div>
        </div>
    );
}

export function Alert({ 
    children, 
    type = "info",
    className = "" 
}: { 
    children: React.ReactNode; 
    type?: "info" | "success" | "warning" | "error";
    className?: string;
}) {
    const baseClasses = "p-4 rounded-lg border";
    
    const typeClasses = {
        info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200",
        success: "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200",
        warning: "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200",
        error: "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200"
    };
    
    return (
        <div className={`${baseClasses} ${typeClasses[type]} ${className}`}>
            {children}
        </div>
    );
}



export function Navigation() {
    const { session, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const router = useRouter();
  
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        
        // Jangan tutup menu jika yang diklik adalah link navigasi
        if (target.closest('a[href]')) {
          return;
        }
        
        if (!target.closest('.user-menu') && !target.closest('.mobile-menu-container')) {
          setIsUserMenuOpen(false);
          setIsMobileMenuOpen(false);
        }
      };
  
      if (isMobileMenuOpen || isUserMenuOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }
  
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isMobileMenuOpen, isUserMenuOpen]);
  
    // ✅ Return null setelah semua hooks dipanggil
    if (!session) return null;

    const navigationItems = [
      {
        label: 'Dashboard',
        href: '/',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        )
      },
      {
        label: 'Transactions',
        href: '/transactions',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        )
      },
      {
        label: 'Categories',
        href: '/categories',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        )
      },
      {
        label: 'Accounts',
        href: '/accounts',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        )
      }
    ];

    const toggleMobileMenu = () => {
      setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const toggleUserMenu = () => {
      setIsUserMenuOpen(!isUserMenuOpen);
    };

    // Handler untuk mobile menu item click
    const handleMobileMenuClick = (href: string) => {
      // Tutup menu terlebih dahulu
      setIsMobileMenuOpen(false);
      
      // Delay sedikit untuk memastikan menu tertutup, lalu navigate
      setTimeout(() => {
        router.push(href);
      }, 100);
    };

    return (
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <Link href="/" className="flex items-center group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg mr-3 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                💳
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Duitku
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
                  Financial Manager
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            {session && (
              <div className="hidden md:flex items-center space-x-1">
                {navigationItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 group"
                  >
                    <span className="group-hover:scale-110 transition-transform duration-200">
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                ))}
              </div>
            )}

            {/* Right side - Actions and User Menu */}
            <div className="flex items-center space-x-3">
              {session ? (
                <>
                  {/* User Menu */}
                  <div className="relative user-menu">
                    <button
                      onClick={toggleUserMenu}
                      className="flex items-center gap-3 p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 group"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                        {session.email?.charAt(0).toUpperCase()}
                      </div>
                      <div className="hidden md:block text-left">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {session.email?.split('@')[0]}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {session.email}
                        </div>
                      </div>
                      <svg className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* User Dropdown Menu */}
                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                        <div className="md:hidden px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {session.email?.split('@')[0]}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {session.email}
                          </div>
                        </div>
                        <button 
                          onClick={logout}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Mobile menu button */}
                  <button
                    onClick={toggleMobileMenu}
                    className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200 mobile-menu-button"
                  >
                    {isMobileMenuOpen ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    )}
                  </button>
                </>
              ) : (
                /* Guest Actions */
                <div className="flex items-center space-x-3">
                  <Link href="/login">
                    <Button variant="outline" className="hidden sm:inline-flex hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all duration-200">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && session && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg animate-in slide-in-from-top-2 duration-300 mobile-menu-container">
            <div className="px-4 pt-4 pb-6 space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => handleMobileMenuClick(item.href)}
                  className="flex items-center gap-4 w-full px-4 py-4 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-200 group text-left"
                >
                  <span className="group-hover:scale-110 transition-transform duration-200">
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>
    );
}