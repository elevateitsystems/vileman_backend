import { BaseService } from "@/core/BaseService";
import { PrismaClient } from "@/generated/prisma/client";
import { PaginationOptions } from "@/types/types";
import {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "./category.validation";
import { uploadToLocal, deleteLocalFile } from "@/utils/localUpload";

export class CategoryService extends BaseService<
  any,
  CreateCategoryInput,
  UpdateCategoryInput
> {
  constructor(prisma: PrismaClient) {
    super(prisma, "Category", {
      enableSoftDelete: true,
      enableAuditFields: true,
    });
  }

  protected getModel() {
    // @ts-ignore - The model 'category' might not exist in PrismaClient types yet
    return this.prisma.category;
  }

  // =========================================================================
  // Public API - Exposing BaseService methods
  // Since BaseService methods are protected, we must expose them here
  // =========================================================================

  public async createCategory(
    data: CreateCategoryInput,
    userId: string,
    imageFile: Express.Multer.File | undefined,
    include?: any,
  ) {
    // ✅ Generate slug
    const slug = await this.generateUniqueSlug(data.name);
    let imageData;
    if (imageFile?.path) {
      const uploaded = await uploadToLocal(
        `${data.name}_${Date.now()}`,
        imageFile.path,
        "category",
      );

      imageData = {
        create: {
          url: uploaded.url,
          publicId: uploaded.publicId,
          type: "category",
        },
      };
    }

    // ✅ Add image relation data to category creation
    // ✅ Create with relation + createdBy
    return await super.create(
      {
        ...data,
        slug,
        createdById: userId,
        image: imageData,
      } as any,
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
      image: true,
    });
  }

  public async findById(id: string, include?: any) {
    return super.findById(id, {
      ...include,
      image: true,
    });
  }

  public async updateCategoryById(
    id: string,
    data: UpdateCategoryInput,
    include?: any,
  ) {
    // 1️⃣ Fetch existing category with image relation
    const existing = await this.getModel().findUnique({
      where: { id },
    });

    if (!existing) throw new Error("Category not found");

    // 4️⃣ Update category with new data + image relation
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
