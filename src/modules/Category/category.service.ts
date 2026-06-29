import { BaseService } from "@/core/BaseService";
import { ImageType, PrismaClient } from "@/generated/prisma/client";
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
          type: ImageType.category,
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
    imageFile?: Express.Multer.File,
    include?: any,
  ) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
      include: { image: true },
    });
    console.log({ existing });
    if (!existing) throw new Error("Category not found");
    console.log({ imageFile });
    if (imageFile) {
      if (existing.image) {
        await this.prisma.image.delete({
          where: { id: existing.image.id },
        });
      }

      const uploaded = await uploadToLocal(
        data.name || existing.name,
        imageFile.path,
        "category",
      );
      console.log({ uploaded });
      await this.prisma.image.create({
        data: {
          url: uploaded.url,
          publicId: uploaded.publicId,
          type: ImageType.category,
          category: {
            connect: { id },
          },
        },
      });
    }

    return this.prisma.category.update({
      where: { id },
      data,
      include: { image: true },
    });
  }
  public async deleteById(id: string, isDeleted: boolean = true) {
    return super.updateById(id, { isDeleted: isDeleted });
  }

  public async exists(filters: any) {
    return super.exists(filters);
  }
}
