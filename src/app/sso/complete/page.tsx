"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

function SSOCompleteContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ssoToken = searchParams.get("ssoToken");

    if (!ssoToken) {
      window.location.href = "/login";
      return;
    }

    fetch("/api/auth/csrf")
      .then(r => r.json())
      .then(({ csrfToken }) => {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = "/api/auth/callback/sso";

        const inputs = { csrfToken, ssoToken, callbackUrl: "/dashboard" };
        Object.entries(inputs).forEach(([name, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = name;
          input.value = value;
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
      });
  }, [searchParams]);

  return (
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Memproses login SSO...</p>
    </div>
  );
}

export default function SSOCompletePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-indigo-100">
      <Suspense fallback={<p>Loading...</p>}>
        <SSOCompleteContent />
      </Suspense>
    </div>
  );
}
