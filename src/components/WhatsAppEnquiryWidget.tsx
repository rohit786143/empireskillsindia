"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

const WHATSAPP_URL = "https://wa.me/message/XYSQI73FHWEXF1";

export function WhatsAppEnquiryWidget() {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  if (pathname?.startsWith("/admin") || pathname?.startsWith("/franchise") || dismissed) {
    return null;
  }

  return (
    <div className="no-print fixed bottom-3.5 right-3 sm:bottom-5 sm:right-6 z-40">
      <div className="relative flex flex-col items-center">
        {/* Cut / Close Button */}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Close Enquiry Popup"
          title="Close"
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-slate-800 hover:bg-red-600 text-white flex items-center justify-center shadow-md border-2 border-white transition-colors z-10"
        >
          <X className="w-3 h-3" />
        </button>

        {/* WhatsApp Enquiry Link */}
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Enquiry Now on WhatsApp"
          className="flex flex-col items-center gap-1 sm:gap-1.5 group"
        >
          <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-[#0B3D62] text-white text-[10px] sm:text-[11px] font-extrabold tracking-wide shadow-lg border border-white/80 whitespace-nowrap group-hover:bg-[#F07228] transition-colors">
            Enquiry Now
          </span>
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] group-hover:bg-[#1EBE5D] text-white flex items-center justify-center shadow-2xl border-2 border-white transition-transform group-hover:scale-105">
            <svg
              viewBox="0 0 32 32"
              className="w-7 h-7 sm:w-8 sm:h-8 fill-current"
              aria-hidden="true"
            >
              <path d="M16.004 2.667C8.636 2.667 2.667 8.636 2.667 16c0 2.352.616 4.648 1.787 6.672L2.54 29.46l6.956-1.825A13.27 13.27 0 0 0 16.004 29.333C23.368 29.333 29.333 23.364 29.333 16S23.368 2.667 16.004 2.667zm0 24.426a11.04 11.04 0 0 1-5.636-1.544l-.404-.24-4.128 1.083 1.102-4.025-.263-.418A11.06 11.06 0 0 1 4.907 16c0-6.12 4.978-11.093 11.097-11.093 6.115 0 11.089 4.973 11.089 11.093 0 6.12-4.974 11.093-11.089 11.093zm6.084-8.308c-.333-.167-1.973-.974-2.279-1.085-.305-.111-.528-.167-.75.167-.222.333-.861 1.085-1.055 1.307-.195.222-.389.25-.722.083-.333-.167-1.407-.519-2.68-1.653-.991-.884-1.66-1.976-1.855-2.309-.194-.333-.02-.514.146-.68.15-.149.333-.389.5-.583.167-.195.222-.333.333-.556.111-.222.056-.417-.028-.583-.083-.167-.75-1.806-1.028-2.473-.27-.65-.546-.562-.75-.572l-.639-.011c-.222 0-.583.083-.889.417-.305.333-1.167 1.14-1.167 2.779s1.195 3.223 1.361 3.445c.167.222 2.351 3.59 5.696 5.035.796.344 1.417.549 1.901.703.799.254 1.526.218 2.1.132.641-.096 1.973-.806 2.251-1.584.278-.778.278-1.445.195-1.584-.084-.139-.306-.222-.639-.389z" />
            </svg>
          </div>
        </a>
      </div>
    </div>
  );
}
