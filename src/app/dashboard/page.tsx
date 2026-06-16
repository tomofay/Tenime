import type { Metadata } from "next";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Kelola watchlist dan riwayat tontonan anime kamu.",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
