"use client";

import { useState, useEffect } from "react";
import TopBar from "@/components/navigation/top-bar";
import SideMenu from "@/components/navigation/side-menu";
import BottomNav from "@/components/navigation/bottom-nav";
import { useAppStore } from "@/store/app-store";

interface Props {
  children: React.ReactNode;
  title?: string;
}

export default function AppShell({ children, title }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const loadAll = useAppStore((s) => s.loadAll);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return (
    <div className="min-h-screen pb-20 lg:pb-0 lg:pl-64">
      <TopBar onOpenMenu={() => setMenuOpen(true)} title={title} />
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main className="px-4 py-5 max-w-3xl mx-auto animate-fade-in lg:px-8 lg:py-6">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
