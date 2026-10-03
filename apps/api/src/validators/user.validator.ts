import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(20).optional(),
  role: z.enum(["CUSTOMER", "ADMIN"]).default("CUSTOMER"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
