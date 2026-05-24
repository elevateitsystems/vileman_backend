import { z } from "zod";

export const CustomizationSchema = z.object({
  selections: z.record(z.string(), z.string()).optional(),
  comment: z.string().optional(),
  images: z.array(z.object({
    url: z.string(),
    publicId: z.string().optional()
  })).optional()
});

export const CheckoutSchema = z.object({
    products: z.array(
        z.object({
            productId: z.string().uuid(),
            quantity: z.number().int().min(1),
            customization: CustomizationSchema.optional(),
        })
    ).min(1),
    customerEmail: z.string().email(),
    customerPhone: z.string(),
    shippingCountry: z.string(),
});

export type CheckoutInput = z.infer<typeof CheckoutSchema>;
