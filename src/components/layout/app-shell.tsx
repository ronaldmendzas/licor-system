"use client";

import { useState } from "react";
import TopBar from "@/components/navigation/top-bar";
import SideMenu from "@/components/navigation/side-menu";
import BottomNav from "@/components/navigation/bottom-nav";

interface Props {
  children: React.ReactNode;
  title?: string;
}

export default function AppShell({ children, title }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950">
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <TopBar onOpenMenu={() => setMenuOpen(true)} title={title} />
        <main className="flex-1 px-4 py-5 pb-24 sm:px-6 lg:px-8 lg:py-6 lg:pb-6 w-full max-w-6xl mx-auto animate-fade-in">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
