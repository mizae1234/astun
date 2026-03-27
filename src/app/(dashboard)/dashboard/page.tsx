import { getDashboardStats, getOwnerDashboardStats } from "@/actions/data";
import { getSession } from "@/lib/access-control";
import StandardDashboardView from "@/components/dashboard/StandardDashboardView";
import OwnerDashboardView from "@/components/dashboard/OwnerDashboardView";

export default async function DashboardPage() {
  const user = await getSession();
  
  if (!user) {
    return <div className="text-center py-20 text-gray-500">กรุณาเข้าสู่ระบบ</div>;
  }

  // Load Owner Dashboard for high-level roles
  if (user.role === "SUPER_ADMIN" || user.role === "OWNER") {
    const data = await getOwnerDashboardStats();
    if (!data) return <div className="text-center py-20 text-gray-500">ไม่สามารถโหลดข้อมูลผู้บริหารได้</div>;
    return <OwnerDashboardView data={data} />;
  }

  // Load Standard Dashboard for other roles
  const data = await getDashboardStats();
  if (!data) return <div className="text-center py-20 text-gray-500">ไม่สามารถโหลดข้อมูลได้</div>;
  
  return <StandardDashboardView data={data} />;
}
