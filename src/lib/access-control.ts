import { auth } from "@/lib/auth";
import { SessionUser } from "@/types";

export async function getSession(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  return session.user as unknown as SessionUser;
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) {
    throw new Error("Unauthorized: กรุณาเข้าสู่ระบบ");
  }
  return user;
}

export async function requireRole(
  ...allowedRoles: SessionUser["role"][]
): Promise<SessionUser> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Forbidden: คุณไม่มีสิทธิ์เข้าถึง");
  }
  return user;
}

export async function requireCompanyAccess(
  companyId: string
): Promise<SessionUser> {
  const user = await requireAuth();

  // SUPER_ADMIN and OWNER can access all companies
  if (user.role === "SUPER_ADMIN" || user.role === "OWNER") {
    return user;
  }

  // Others must belong to the same company
  if (user.companyId !== companyId) {
    throw new Error("Forbidden: ไม่สามารถเข้าถึงข้อมูลบริษัทอื่น");
  }

  return user;
}

export async function requireBranchAccess(
  branchId: string
): Promise<SessionUser> {
  const user = await requireAuth();

  // SUPER_ADMIN, OWNER, COMPANY_ADMIN can access all branches in their scope
  if (
    user.role === "SUPER_ADMIN" ||
    user.role === "OWNER" ||
    user.role === "COMPANY_ADMIN"
  ) {
    return user;
  }

  // BRANCH_ADMIN and STAFF must belong to the same branch
  if (user.branchId !== branchId) {
    throw new Error("Forbidden: ไม่สามารถเข้าถึงข้อมูลสาขาอื่น");
  }

  return user;
}

/**
 * Get companyId filter for queries based on user role
 * SUPER_ADMIN/OWNER: specific companyId (passed) or undefined (all)
 * Others: only their own company
 */
export function getCompanyFilter(
  user: SessionUser,
  selectedCompanyId?: string
): string | undefined {
  if (user.role === "SUPER_ADMIN" || user.role === "OWNER") {
    return selectedCompanyId || undefined;
  }
  return user.companyId || undefined;
}

/**
 * Get branchId filter for queries based on user role
 */
export function getBranchFilter(
  user: SessionUser,
  selectedBranchId?: string
): string | undefined {
  if (
    user.role === "SUPER_ADMIN" ||
    user.role === "OWNER" ||
    user.role === "COMPANY_ADMIN"
  ) {
    return selectedBranchId || undefined;
  }
  return user.branchId || undefined;
}
