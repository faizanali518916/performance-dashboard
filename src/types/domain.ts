export type AccessLevel = "EMPLOYEE" | "MANAGER" | "ADMIN";
export type UserStatus = "active" | "inactive";
export type JournalCategory = "GOOD" | "BAD";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  accessLevel: AccessLevel;
  role: { id: string; title: string };
  managerId: string | null;
}
