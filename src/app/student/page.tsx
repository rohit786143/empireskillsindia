"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyStudentQrRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/verify-certificate/");
  }, [router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center text-sm text-slate-600">
      Redirecting to Certificate Verification Portal...
    </div>
  );
}
