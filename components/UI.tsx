"use client";
import React from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

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

    if (!session) return null;

    const navItems = [
        { href: "/", label: "Dashboard", icon: "🏠" },
        { href: "/categories", label: "Categories", icon: "📊" },
        { href: "/accounts", label: "Accounts", icon: "🏦" },
        { href: "/transactions", label: "Transactions", icon: "💰" }
    ];

    return (
        <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">D</span>
                            </div>
                            <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Duitku
                            </span>
                        </Link>
                    </div>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center space-x-4">
                        <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                            <span>Welcome,</span>
                            <span className="font-medium text-gray-800 dark:text-gray-200">
                                {session.email}
                            </span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={logout}
                            className="flex items-center space-x-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Sign Out</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
                <div className="px-2 pt-2 pb-3 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center space-x-3 px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
}