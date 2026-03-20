import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = {
    name: session.user.name || "User",
    email: session.user.email || "",
    role: (session.user as Record<string, unknown>).role as string || "STAFF",
    companyName: (session.user as Record<string, unknown>).companyName as string | null,
    branchName: (session.user as Record<string, unknown>).branchName as string | null,
  };

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
