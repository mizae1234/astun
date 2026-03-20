export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "OWNER" | "COMPANY_ADMIN" | "BRANCH_ADMIN" | "STAFF";
  companyId: string | null;
  branchId: string | null;
  companyName: string | null;
  branchName: string | null;
};

export type ActionResult<T = undefined> = {
  success: boolean;
  message: string;
  data?: T;
};
