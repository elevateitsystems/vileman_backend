import { BaseService } from "@/core/BaseService";
import { PrismaClient } from "@/generated/prisma/client";
import { PaginationOptions } from "@/types/types";
import {
  CreateSubCategoryInput,
  UpdateSubCategoryInput,
} from "./subCategory.validation";
import { uploadToLocal, deleteLocalFile } from "@/utils/localUpload";

export class SubCategoryService extends BaseService<
  any,
  CreateSubCategoryInput,
  UpdateSubCategoryInput
> {
  constructor(prisma: PrismaClient) {
    super(prisma, "SubCategory", {
      enableSoftDelete: true,
      enableAuditFields: true,
    });
  }

  protected getModel() {
    // @ts-ignore - The model 'subCategory' might not exist in PrismaClient types yet
    return this.prisma.subCategory;
  }

  // =========================================================================
  // Public API - Exposing BaseService methods
  // Since BaseService methods are protected, we must expose them here
  // =========================================================================

  public async create(
    data: CreateSubCategoryInput,
    userId: string,
    include?: any,
  ) {
    // ✅ Generate slug
    const slug = await this.generateUniqueSlug(data.name);

    // ✅ Create with relation + createdBy
    return await super.create(
      {
        ...data,
        slug,
        createdById: userId,
      },
      include,
    );
  }

  public async findMany(
    filters: any = {},
    pagination?: Partial<PaginationOptions>,
    orderBy?: any,
    include?: any,
  ) {
    return super.findMany(filters, pagination, orderBy, {
      ...include,
      category: true,
    });
  }

  public async findById(id: string, include?: any) {
    return super.findById(id, {
      ...include,
      category: true,
    });
  }

  public async updateById(
    id: string,
    data: UpdateSubCategoryInput,
    include?: any,
  ) {
    const existing = await this.getModel().findUnique({
      where: { id },
    });

    if (!existing) throw new Error("SubCategory not found");

    return super.updateById(
      id,
      {
        ...data,
      } as any,
      include,
    );
  }

  public async deleteById(id: string, isDeleted: boolean = true) {
    return super.updateById(id, { isDeleted: isDeleted });
  }
  public async exists(filters: any) {
    return super.exists(filters);
  }
}
