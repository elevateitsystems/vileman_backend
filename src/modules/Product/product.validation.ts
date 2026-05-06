import { z } from "zod";

const slugRegex = /^[a-z0-9-]+$/;

const ProductImageSchema = z.object({
  url: z.string().url("Invalid image URL"),
  publicId: z.string().optional(),
  type: z.literal("product"),
});

export const ProductValidation = {
  // Create Product
  create: z
    .object({
      name: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(150),

      slug: z
        .string()
        .trim()
        .min(2, "Slug must be at least 2 characters")
        .max(160)
        .regex(slugRegex, "Slug must be lowercase and hyphen-separated")
        .optional(),

      description: z.string().trim().max(1000).optional(),

      price: z.coerce.number().positive("Price must be a positive number"),

      discount: z.coerce
        .number()
        .min(0, "Discount cannot be negative")
        .optional()
        .default(0),

      discountPrice: z.coerce.number().min(0).optional(),

      stock: z.coerce.number().int().min(0).optional().default(0),

      quantity: z.coerce.number().int().min(0).optional().default(0),

      colors: z
        .union([z.string(), z.array(z.string())])
        .optional()
        .transform((value) => {
          if (!value) return [];

          if (Array.isArray(value)) {
            return value.map((color) => color.trim()).filter(Boolean);
          }

          try {
            const parsed = JSON.parse(value);

            if (Array.isArray(parsed)) {
              return parsed
                .map((color) => String(color).trim())
                .filter(Boolean);
            }
          } catch {}

          return value
            .split(",")
            .map((color) => color.trim())
            .filter(Boolean);
        }),

      categoryId: z.string().uuid("Invalid category ID"),

      subCategoryId: z.string().uuid("Invalid sub-category ID").optional(),

      createdById: z.string().uuid("Invalid user ID").optional(),

      images: z.array(ProductImageSchema).optional(),
    })
    .strict()
    .transform((data) => {
      if (data.discount && data.price) {
        const calculated = data.price - (data.price * data.discount) / 100;

        return {
          ...data,
          discountPrice: data.discountPrice ?? calculated,
        };
      }

      return data;
    })
    .refine((data) => !data.discountPrice || data.discountPrice <= data.price, {
      message: "Discount price cannot be greater than original price",
      path: ["discountPrice"],
    }),

  // Update Product
  update: z
    .object({
      name: z.string().trim().min(2).max(150).optional(),

      slug: z
        .string()
        .trim()
        .min(2)
        .max(160)
        .regex(slugRegex, "Slug must be lowercase and hyphen-separated")
        .optional(),

      description: z.string().trim().max(1000).optional(),

      price: z.coerce.number().positive().optional(),

      discount: z.coerce.number().min(0).optional(),

      discountPrice: z.coerce.number().min(0).optional(),

      stock: z.coerce.number().int().min(0).optional(),

      quantity: z.coerce.number().int().min(0).optional(),

      colors: z
        .union([z.string(), z.array(z.string())])
        .optional()
        .transform((value) => {
          if (!value) return [];

          if (Array.isArray(value)) {
            return value.map((color) => color.trim()).filter(Boolean);
          }

          try {
            const parsed = JSON.parse(value);

            if (Array.isArray(parsed)) {
              return parsed
                .map((color) => String(color).trim())
                .filter(Boolean);
            }
          } catch {}

          return value
            .split(",")
            .map((color) => color.trim())
            .filter(Boolean);
        }),

      categoryId: z.string().uuid().optional(),

      subCategoryId: z.string().uuid().nullable().optional(),
      deleteImageIds: z.string().optional(),
      images: z.array(ProductImageSchema).optional(),

      isDeleted: z.boolean().optional(),
    })
    .strict()
    .transform((data) => {
      if (data.discount && data.price) {
        const calculated = data.price - (data.price * data.discount) / 100;

        return {
          ...data,
          discountPrice: data.discountPrice ?? calculated,
        };
      }

      return data;
    })
    .refine(
      (data) =>
        !data.discountPrice || !data.price || data.discountPrice <= data.price,
      {
        message: "Discount price cannot be greater than price",
        path: ["discountPrice"],
      },
    )
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required for update",
    }),

  params: {
    id: z.object({
      id: z.string().uuid("Invalid product ID"),
    }),
  },

  query: {
    list: z.object({
      page: z.preprocess(
        (val) => Number(val) || 1,
        z.number().int().min(1).default(1),
      ),

      limit: z.preprocess((val) => {
        const num = Number(val) || 10;
        return Math.min(Math.max(num, 1), 100);
      }, z.number().int().min(1).max(100).default(10)),

      search: z.string().trim().optional(),

      categoryId: z.string().uuid().optional(),

      subCategoryId: z.string().uuid().optional(),

      minPrice: z.coerce.number().min(0).optional(),

      maxPrice: z.coerce.number().min(0).optional(),

      inStock: z.preprocess((val) => {
        if (val === "true") return true;
        if (val === "false") return false;
        return undefined;
      }, z.boolean().optional()),

      sortBy: z
        .enum(["name", "price", "createdAt", "updatedAt"])
        .default("createdAt"),

      sortOrder: z.enum(["asc", "desc"]).default("desc"),

      isDeleted: z.preprocess((val) => {
        if (val === "true") return true;
        if (val === "false") return false;
        return false;
      }, z.boolean().default(false)),
    }),

    search: z
      .object({
        q: z.string().trim().optional(),
        search: z.string().trim().optional(),

        limit: z.preprocess((val) => {
          const num = Number(val) || 10;
          return Math.min(Math.max(num, 1), 50);
        }, z.number().int().min(1).max(50).default(10)),
      })
      .refine((data) => data.q || data.search, {
        message: 'Either "q" or "search" parameter is required',
        path: ["q"],
      }),
  },
};

// Types
export type CreateProductInput = z.infer<typeof ProductValidation.create>;
export type UpdateProductInput = z.infer<typeof ProductValidation.update>;
export type ProductIdParams = z.infer<typeof ProductValidation.params.id>;
export type ListProductQueryDto = z.infer<typeof ProductValidation.query.list>;
export type SearchProductQueryDto = z.infer<
  typeof ProductValidation.query.search
>;
