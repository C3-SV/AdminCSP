export type AdminAllowlistRole = "owner" | "admin";

export type AdminAllowlistEntry = {
  id: string;
  email: string;
  role: AdminAllowlistRole;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
};

