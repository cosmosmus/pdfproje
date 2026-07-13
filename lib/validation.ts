import { z } from "zod";

export const gateRequestSchema = z.object({
  slug: z.string().min(1),
  email: z.string().email(),
});

export const trackEntrySchema = z.object({
  page: z.number().int().min(1),
  durationMs: z.number().int().min(0).max(120_000),
});

export const trackRequestSchema = z.object({
  slug: z.string().min(1),
  visitId: z.string().uuid(),
  referrer: z.string().max(500).optional(),
  entries: z.array(trackEntrySchema).min(1).max(50),
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const adminProfileUpdateSchema = z.object({
  currentPassword: z.string().min(1),
  newEmail: z.string().email().optional(),
  newPassword: z.string().min(6).optional(),
});
