"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";


export default function Protected({ children }: { children: React.ReactNode }) {
    const { session, loading } = useAuth();
    const router = useRouter();
  
    useEffect(() => {
      if (!loading && !session) {
        router.replace("/login");
      }
    }, [session, loading, router]);
  
    if (loading) {
      return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }
  
    if (!session) return null;
  
    return <>{children}</>;
  }
  