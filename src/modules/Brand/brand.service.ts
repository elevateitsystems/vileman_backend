import { BaseService } from "@/core/BaseService";
import { PrismaClient } from "@/generated/prisma/client";
import { PaginationOptions } from "@/types/types";
import { CreateBrandInput, UpdateBrandInput } from "./brand.validation";
import {
  uploadToLocal,
  deleteLocalFile
} from "@/utils/localUpload";

export class BrandService extends BaseService<
  any,
  CreateBrandInput,
  UpdateBrandInput
> {
  constructor(prisma: PrismaClient) {
    super(prisma, "Brand", {
      enableSoftDelete: true,
      enableAuditFields: true,
    });
  }

  protected getModel() {
    // @ts-ignore - The model 'brand' might not exist in PrismaClient types yet
    return this.prisma.brand;
  }

  // =========================================================================
  // Public API - Exposing BaseService methods
  // Since BaseService methods are protected, we must expose them here
  // =========================================================================

  public async create(
    data: CreateBrandInput,
    userId: string,
    imageFile?: Express.Multer.File,
    include?: any,
  ) {
    // ✅ Generate slug
    const slug = await this.generateUniqueSlug(data.name);

    let imageData: any = undefined;

    // ✅ Upload image if exists
    if (imageFile) {
      const uploaded = await uploadToLocal(
        data.name,
        imageFile.path,
        "brands"
      );
      imageData = {
        create: {
          url: uploaded.url,
          publicId: uploaded.publicId,
          type: "brand",
        },
      };
    }

    return super.create(
      { ...data, slug: slug, logo: imageData, createdById: userId },
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
      logo: true,
    });
  }

  public async findById(id: string, include?: any) {
    return super.findById(id, {
      logo: true,
    });
  }

  public async updateById(
    id: string,
    data: UpdateBrandInput,
    imageFile?: Express.Multer.File,
    include?: any,
  ) {
    // 1️⃣ Fetch existing category with image relation
    const existing = await this.getModel().findUnique({
      where: { id },
      include: { logo: true },
    });
    if (!existing) throw new Error("Brand not found");
    let imageData = undefined;
    if (imageFile) {
      // 3️⃣ Upload new image
      const uploaded = await uploadToLocal(
        data.name || existing.name,
        imageFile.path,
        "brands"
      );
      
      imageData = {
        upsert: {
          update: {
            url: uploaded.url,
            publicId: uploaded.publicId,
            type: "brand",
          },
          create: {
            url: uploaded.url,
            publicId: uploaded.publicId,
            type: "brand",
          },
        },
      };

      // 2️⃣ Delete old image from local storage if exists
      if (existing.logo?.publicId) {
        await deleteLocalFile(existing.logo.publicId, "brands");
      }
    }
    return super.updateById(
      id,
      {
        ...data,
        slug: data.name
          ? await this.generateUniqueSlug(data.name, id)
          : undefined,
        logo: imageData,
      } as any,
      include,
    );
  }

  public async deleteById(id: string) {
    const existing = await this.getModel().findUnique({
      where: { id },
      include: { logo: true },
    });
    if (!existing) throw new Error("Brand not found");
    if (existing.logo?.publicId) {
      await deleteLocalFile(existing.logo.publicId, "brands");
    }
    return super.deleteById(id);
  }

  public async exists(filters: any) {
    return super.exists(filters);
  }
}
