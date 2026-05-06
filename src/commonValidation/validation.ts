import { z } from "zod";

export const ImageSchema = z.object({
  url: z.string().url(),
  publicId: z.string().optional(),
  type: z.enum(["category", "subcategory", "product"]),
});
