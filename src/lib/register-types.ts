export const REGISTERABLE_ROLES = ["friend", "employee", "csr", "provider", "promoter"] as const;
export type RegisterableRole = (typeof REGISTERABLE_ROLES)[number];

export function isRegisterableRole(value: string): value is RegisterableRole {
  return (REGISTERABLE_ROLES as readonly string[]).includes(value);
}
