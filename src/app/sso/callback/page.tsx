"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

function CallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const sig = searchParams.get("sig");

    if (token && sig) {
      window.location.href = `/api/auth/sso?token=${token}&sig=${sig}`;
    } else {
      window.location.href = "/login";
    }
  }, [searchParams]);

  return (
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Memproses login SSO...</p>
    </div>
  );
}

export default function SSOCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Suspense fallback={<p>Loading...</p>}>
        <CallbackContent />
      </Suspense>
    </div>
  );
}
