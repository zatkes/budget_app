"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ActivityIcon,
  AdvisorIcon,
  BudgetIcon,
  GoalsIcon,
  HomeIcon,
  InvestIcon,
} from "./icons";

const TABS = [
  { href: "/home", label: "Home", Icon: HomeIcon },
  { href: "/budget", label: "Budget", Icon: BudgetIcon },
  { href: "/invest", label: "Invest", Icon: InvestIcon },
  { href: "/goals", label: "Goals", Icon: GoalsIcon },
  { href: "/activity", label: "Activity", Icon: ActivityIcon },
  { href: "/advisor", label: "Advisor", Icon: AdvisorIcon },
] as const;

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-shrink-0 items-center justify-around px-1.5 pt-2.5 pb-5 backdrop-blur-xl"
      style={{ background: "var(--tabbar-bg)", borderTop: "1px solid var(--card-border)" }}
    >
      {TABS.map(({ href, label, Icon }) => {
        const active = pathname === href;
        const color = active ? "#ffffff" : "var(--text-muted)";
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-0.5 rounded-2xl px-2.5 py-1.5"
            style={
              active
                ? {
                    background: "rgba(139,92,246,0.28)",
                    boxShadow: "0 0 0 1px rgba(167,139,250,0.4), 0 0 18px rgba(139,92,246,0.5)",
                  }
                : undefined
            }
          >
            <Icon color={color} />
            <span className="text-[10px] font-semibold" style={{ color }}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
