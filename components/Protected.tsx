"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";


export default function Protected({ children }: { children: React.ReactNode }) {
const { session } = useAuth();
const router = useRouter();


useEffect(() => {
if (!session) router.replace("/login");
}, [session, router]);


if (!session) return null;
return <>{children}</>;
}