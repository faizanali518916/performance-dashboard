import { z } from "zod";

export const uuid = z.string().uuid();
export const dateOnly = z.string().regex(/^\d{4}-\d{2}-01$/, "Period must be the first day of a month");
const password = z
  .string()
  .min(10)
  .max(72)
  .regex(/[a-z]/, "Add a lowercase letter")
  .regex(/[A-Z]/, "Add an uppercase letter")
  .regex(/\d/, "Add a number");

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(320),
  password,
});
export const loginSchema = z.object({ email: z.string().trim().email().max(320), password: z.string().min(1).max(72) });
export const forgotSchema = z.object({ email: z.string().trim().email().max(320) });
export const tokenSchema = z.object({ token: z.string().min(32).max(256) });
export const resetSchema = tokenSchema.extend({ password });
export const createRoleSchema = z.object({ title: z.string().trim().min(2).max(120) });
export const updateRoleSchema = createRoleSchema.partial();
export const createKpiSchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).nullable().optional(),
  unit: z.string().trim().max(40).nullable().optional(),
});
export const assignKpiSchema = z.object({ kpiId: uuid, target: z.coerce.number().finite().nonnegative() });
export const performanceSchema = z.object({
  userId: uuid,
  kpiId: uuid,
  period: dateOnly,
  current: z.coerce.number().finite().nonnegative(),
  target: z.coerce.number().finite().positive(),
});
export const journalSchema = z.object({
  userId: uuid,
  description: z.string().trim().min(3).max(5000),
  category: z.enum(["GOOD", "BAD"]),
  impact: z.coerce.number().finite().min(0).max(100),
  period: dateOnly,
});
export const createUserSchema = registerSchema.extend({
  roleId: uuid,
  managerId: uuid.nullable().optional(),
  accessLevel: z.enum(["EMPLOYEE", "MANAGER", "ADMIN"]).default("EMPLOYEE"),
  status: z.enum(["active", "inactive"]).default("active"),
});
export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  roleId: uuid.optional(),
  managerId: uuid.nullable().optional(),
  accessLevel: z.enum(["EMPLOYEE", "MANAGER", "ADMIN"]).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export function firstZodError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid request";
}
