import type { Metadata } from "next";
import { SchedulePage } from "@/components/schedule/SchedulePage";

export const metadata: Metadata = {
  title: "Jadwal Anime",
  description: "Jadwal anime tayang harian.",
};

export default function Page() {
  return <SchedulePage />;
}
