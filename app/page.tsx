"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const response = await fetch("/api/me");
      if (response.ok) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    };

    checkSession();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-600">
      Cargando...
    </div>
  );
}
