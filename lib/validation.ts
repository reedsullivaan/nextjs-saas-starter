import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().max(100).optional(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export const workspaceSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(40)
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
});

export const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export const updateUserSchema = z.object({
  name: z.string().max(100).nullable(),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(50),
});

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 40);
}
