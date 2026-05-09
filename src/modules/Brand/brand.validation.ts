import { z } from "zod";

export const BrandValidation = {
  // ✅ Create Brand
  create: z
    .object({
      name: z.string().min(2, "Name must be at least 2 characters").max(100),

      slug: z
        .string()
        .min(2, "Slug must be at least 2 characters")
        .max(120)
        .regex(/^[a-z0-9-]+$/, "Slug must be lowercase and hyphen-separated")
        .optional(),

      description: z.string().max(500).optional(),

      // 👤 From auth
      createdById: z.string().uuid("Invalid user ID").optional(),

      // 🖼 Logo (Image relation)
      logoId: z.string().uuid("Invalid image ID").optional(),

      logo: z
        .object({
          url: z.string().url("Invalid image URL"),
          publicId: z.string().optional(),
          type: z.enum(["brand"]),
        })
        .optional(),
    })
    .strict(),

  // ✅ Update Brand
  update: z
    .object({
      name: z.string().min(2).max(100).optional(),

      slug: z
        .string()
        .min(2)
        .max(120)
        .regex(/^[a-z0-9-]+$/, "Slug must be lowercase and hyphen-separated")
        .optional(),

      description: z.string().max(500).optional(),

      logoId: z.string().uuid().nullable().optional(),
      logo: z
        .object({
          url: z.string().url("Invalid image URL"),
          publicId: z.string().optional(),
          type: z.enum(["brand"]),
        })
        .optional(),
      isDeleted: z.boolean().optional(),
    })
    .strict(),

  // ✅ Params
  params: {
    id: z.object({
      id: z.string().uuid("Invalid brand ID"),
    }),
  },

  // ✅ Query (consistent with Category/SubCategory)
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

      search: z.string().optional(),

      sortBy: z.enum(["name", "createdAt", "updatedAt"]).default("createdAt"),

      sortOrder: z.enum(["asc", "desc"]).default("desc"),

      isDeleted: z.preprocess((val) => {
        if (val === "true") return true;
        if (val === "false") return false;
        return false;
      }, z.boolean().default(false)),
    }),

    search: z
      .object({
        q: z.string().optional(),
        search: z.string().optional(),

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

// ✅ Types
export type CreateBrandInput = z.infer<typeof BrandValidation.create>;
export type UpdateBrandInput = z.infer<typeof BrandValidation.update>;
export type BrandIdParams = z.infer<typeof BrandValidation.params.id>;
export type ListBrandQueryDto = z.infer<typeof BrandValidation.query.list>;
export type SearchBrandQueryDto = z.infer<typeof BrandValidation.query.search>;
