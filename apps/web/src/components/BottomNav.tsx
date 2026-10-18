"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Feed", icon: "⚡" },
  { href: "/today", label: "Today", icon: "🎯" },
  { href: "/words", label: "Words", icon: "📚" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 540,
          backgroundColor: "var(--surface)",
          borderTop: "1px solid var(--border)",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          padding: "6px 8px 10px",
          pointerEvents: "auto",
        }}
      >
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                padding: "4px 0",
                borderRadius: 10,
                color: active ? "var(--accent)" : "var(--muted)",
                fontWeight: active ? 700 : 500,
                fontSize: "0.75rem",
              }}
            >
              <span style={{ fontSize: "1.1rem" }} aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
