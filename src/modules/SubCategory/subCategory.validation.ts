import { z } from "zod";

const slugRegex = /^[a-z0-9-]+$/;

export const SubCategoryValidation = {
  // Create SubCategory
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
        .max(120)
        .regex(slugRegex, "Slug must be lowercase and hyphen-separated")
        .optional(),

      description: z
        .string()
        .trim()
        .max(500, "Description must not exceed 500 characters")
        .optional(),

      categoryId: z.string().uuid("Invalid category ID"),

      // usually from auth middleware
      createdById: z.string().uuid("Invalid user ID").optional(),
    })
    .strict(),

  // Update SubCategory
  update: z
    .object({
      name: z.string().trim().min(2).max(100).optional(),

      slug: z
        .string()
        .trim()
        .min(2)
        .max(120)
        .regex(slugRegex, "Slug must be lowercase and hyphen-separated")
        .optional(),

      description: z.string().trim().max(500).optional(),

      categoryId: z.string().uuid("Invalid category ID").optional(),

      isDeleted: z.boolean().optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required for update",
    }),

  // Params
  params: {
    id: z.object({
      id: z.string().uuid("Invalid sub-category ID"),
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

      categoryId: z.string().uuid("Invalid category ID").optional(),
    }),

    search: z
      .object({
        q: z.string().trim().optional(),
        search: z.string().trim().optional(),
        categoryId: z.string().uuid("Invalid category ID").optional(),

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
export type CreateSubCategoryInput = z.infer<
  typeof SubCategoryValidation.create
>;
export type UpdateSubCategoryInput = z.infer<
  typeof SubCategoryValidation.update
>;
export type SubCategoryIdParams = z.infer<
  typeof SubCategoryValidation.params.id
>;
export type ListSubCategoryQueryDto = z.infer<
  typeof SubCategoryValidation.query.list
>;
export type SearchSubCategoryQueryDto = z.infer<
  typeof SubCategoryValidation.query.search
>;
