"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { hasInSiteHistory } from "@/lib/navHistory";
import { useTransitionNavigate } from "@/components/PageTransition";

export default function BackButton() {
  const router = useRouter();
  const navigate = useTransitionNavigate();

  return (
    <Link
      href="/"
      data-transition="manual"
      className="cl-btn cl-btn--ghost cl-btn--sm cl-back"
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        navigate(() => (hasInSiteHistory() ? router.back() : router.push("/")));
      }}
    >
      <ArrowLeft size={16} strokeWidth={2} aria-hidden />
      <span>Zpět</span>
    </Link>
  );
}
