import { z } from "zod";

export const addItemSchema = z.object({
  productId: z.string().uuid({ message: "Invalid product ID" }),
  quantity: z.number().int().positive().default(1),
});

export const updateItemSchema = z.object({
  productId: z.string().uuid({ message: "Invalid product ID" }),
  quantity: z.number().int().min(0), // 0 means remove
});

export const removeItemSchema = z.object({
  productId: z.string().uuid({ message: "Invalid product ID" }),
});

export type AddItemInput = z.infer<typeof addItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
