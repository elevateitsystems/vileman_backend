import { BaseService } from "@/core/BaseService";
import { PrismaClient } from "@/generated/prisma/client";
import { PaginationOptions } from "@/types/types";
import { CreateImageInput, UpdateImageInput } from "./image.validation";
import { uploadToLocal } from "@/utils/localUpload";

export class ImageService extends BaseService<
  any,
  CreateImageInput,
  UpdateImageInput
> {
  constructor(prisma: PrismaClient) {
    super(prisma, "Image", {
      enableSoftDelete: true,
      enableAuditFields: true,
    });
  }

  protected getModel() {
    // @ts-ignore - The model 'image' might not exist in PrismaClient types yet
    return this.prisma.image;
  }

  // =========================================================================
  // Public API - Exposing BaseService methods
  // Since BaseService methods are protected, we must expose them here
  // =========================================================================

  public async upload(imageFiles?: Express.Multer.File[], include?: any) {
    // upload multiple images if provided
    let uploadedResults: any[] = [];
    if (imageFiles && imageFiles.length > 0) {
      const uploadPromises = imageFiles.map((file, index) =>
        uploadToLocal(`${file.originalname}-${index}`, file.path, "orders"),
      );

      uploadedResults = await Promise.all(uploadPromises);
    }
    console.log("Uploaded Results:", uploadedResults);
    return uploadedResults;
  }

  public async findMany(
    filters: any = {},
    pagination?: Partial<PaginationOptions>,
    orderBy?: any,
    include?: any,
  ) {
    return super.findMany(filters, pagination, orderBy, include);
  }

  public async findById(id: string, include?: any) {
    return super.findById(id, include);
  }

  public async updateById(id: string, data: UpdateImageInput, include?: any) {
    return super.updateById(id, data, include);
  }

  public async deleteById(id: string) {
    return super.deleteById(id);
  }

  public async exists(filters: any) {
    return super.exists(filters);
  }
}
