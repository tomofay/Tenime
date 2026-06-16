import type { Metadata } from "next";
import { EditProfileClient } from "@/components/dashboard/EditProfileClient";

export const metadata: Metadata = {
  title: "Edit Profile",
  description: "Edit profil kamu.",
};

export default function Page() {
  return <EditProfileClient />;
}
