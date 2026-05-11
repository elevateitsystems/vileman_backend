import { z } from "zod";

import { stringToNumber } from "@/utils/stringToNumber";
const emailSchema = z
  .email("Invalid email address")
  .min(5, "Email must be at least 5 characters")
  .max(255, "Email must not exceed 255 characters")
  .toLowerCase()
  .trim();
const roleSchema = z.enum(["user", "admin"]);
export const UserValidation = {
  // Update User
  update: z
    .object({
      email: emailSchema.optional(),
      firstName: z
        .string()
        .min(2, "First name must be at least 2 characters")
        .max(100, "First name must not exceed 100 characters")
        .trim()
        .optional(),
      lastName: z
        .string()
        .min(2, "Last name must be at least 2 characters")
        .max(100, "Last name must not exceed 100 characters")
        .trim()
        .optional(),
      username: z
        .string()
        .min(3, "Username must be at least 3 characters")
        .max(50, "Username must not exceed 50 characters")
        .trim()
        .optional(),
      role: roleSchema.optional(),
      designation: z.string().optional(),
      modules: z.array(z.string()).optional(),
      avatarUrl: z.string().url("Invalid URL format").optional(),
      isDeleted: z.boolean().optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update",
    }),

  // Params validation
  params: {
    id: z.object({
      id: z.string().uuid("Invalid ID format"),
    }),
  },
  // Query validations
  query: {
    list: z
      .object({
        page: z.preprocess(
          (val) => stringToNumber(val) || 1,
          z.number().int().min(1).default(1),
        ),

        limit: z.preprocess((val) => {
          const num = stringToNumber(val) || 10;
          return Math.min(Math.max(num, 1), 100);
        }, z.number().int().min(1).max(100).default(10)),

        search: z.string().optional(),

        sortBy: z
          .enum(["name", "email", "createdAt", "updatedAt"])
          .default("createdAt"),

        sortOrder: z.enum(["asc", "desc"]).default("desc"),
        isDeleted: z.preprocess((val) => {
          if (val === "true") return true;
          if (val === "false") return false;
          return false;
        }, z.boolean().default(false)),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        role: roleSchema.optional(),
      })
      .transform((data) => ({
        ...data,
        search: data.search === "" ? undefined : data.search,
      })),

    search: z
      .object({
        q: z.string().min(1, "Search term is required").optional(),
        search: z.string().min(1, "Search term is required").optional(),

        limit: z.preprocess((val) => {
          const num = stringToNumber(val) || 10;
          return Math.min(Math.max(num, 1), 50);
        }, z.number().int().min(1).max(50).default(10)),
      })
      .refine((data) => data.q || data.search, {
        message: 'Either "q" or "search" parameter is required',
        path: ["q"],
      }),

    pagination: z.object({
      page: z.preprocess(
        (val) => stringToNumber(val) || 1,
        z.number().int().min(1).default(1),
      ),

      limit: z.preprocess((val) => {
        const num = stringToNumber(val) || 10;
        return Math.min(Math.max(num, 1), 100);
      }, z.number().int().min(1).max(100).default(10)),
    }),
  },
};

export type UpdateUserInput = z.infer<typeof UserValidation.update>;
export type UserIdParams = z.infer<typeof UserValidation.params.id>;
export type ListUserQueryDto = z.infer<typeof UserValidation.query.list>;
export type SearchUserQueryDto = z.infer<typeof UserValidation.query>;
export type PaginationUserDto = z.infer<typeof UserValidation.query.pagination>;
