import { z } from "zod";

const slugRegex = /^[a-z0-9-]+$/;

export const CategoryValidation = {
  // Create Category
  create: z
    .object({
      name: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must not exceed 100 characters"),

      slug: z
        .string()
        .trim()
        .min(2, "Slug must be at least 2 characters")
        .max(120, "Slug must not exceed 120 characters")
        .regex(slugRegex, "Slug must be lowercase and hyphen-separated")
        .optional(),

      description: z
        .string()
        .trim()
        .max(500, "Description must not exceed 500 characters")
        .optional(),

      // Usually from auth middleware
      createdById: z.string().uuid("Invalid user ID").optional(),
    })
    .strict(),

  // Update Category
  update: z
    .object({
      name: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must not exceed 100 characters")
        .optional(),

      slug: z
        .string()
        .trim()
        .min(2, "Slug must be at least 2 characters")
        .max(120, "Slug must not exceed 120 characters")
        .regex(slugRegex, "Slug must be lowercase and hyphen-separated")
        .optional(),

      description: z
        .string()
        .trim()
        .max(500, "Description must not exceed 500 characters")
        .optional(),

      isDeleted: z.boolean().optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required for update",
    }),

  // Params
  params: {
    id: z.object({
      id: z.string().uuid("Invalid category ID"),
    }),
  },

  // Query
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
export type CreateCategoryInput = z.infer<typeof CategoryValidation.create>;
export type UpdateCategoryInput = z.infer<typeof CategoryValidation.update>;
export type CategoryIdParams = z.infer<typeof CategoryValidation.params.id>;
export type ListCategoryQueryDto = z.infer<
  typeof CategoryValidation.query.list
>;
export type SearchCategoryQueryDto = z.infer<
  typeof CategoryValidation.query.search
>;
