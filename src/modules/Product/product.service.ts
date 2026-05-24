import { BaseService } from "@/core/BaseService";
import { PrismaClient } from "@/generated/prisma/client";
import { PaginationOptions } from "@/types/types";
import { CreateProductInput, UpdateProductInput } from "./product.validation";
import { uploadToLocal, deleteLocalFile } from "@/utils/localUpload";

export class ProductService extends BaseService<
  any,
  CreateProductInput,
  UpdateProductInput
> {
  constructor(prisma: PrismaClient) {
    super(prisma, "Product", {
      enableSoftDelete: true,
      enableAuditFields: true,
    });
  }

  protected getModel() {
    // @ts-ignore - The model 'product' might not exist in PrismaClient types yet
    return this.prisma.product;
  }

  // =========================================================================
  // Public API - Exposing BaseService methods
  // Since BaseService methods are protected, we must expose them here
  // =========================================================================

  /**
   * Create a new product with multiple images
   */

  public async createProduct(
    data: CreateProductInput,
    userId: string,
    imageFiles?: Express.Multer.File[],
    include?: any,
  ) {
    // generate unique slug
    const slug = await this.generateUniqueSlug(data.name);

    let imagesData: any = undefined;

    // upload multiple images if provided
    if (imageFiles && imageFiles.length > 0) {
      const uploadPromises = imageFiles.map((file, index) =>
        uploadToLocal(`${data.name}-${index}`, file.path, "products"),
      );

      const uploadedResults = await Promise.all(uploadPromises);

      imagesData = {
        create: uploadedResults.map((uploaded) => ({
          url: uploaded.url,
          publicId: uploaded.publicId,
          type: "product",
        })),
      };
    }

    // create product
    return await super.create(
      {
        ...data,
        // colors,
        slug,
        stock: data.quantity,
        isCustomizable: data.isCustomizable ?? false,
        createdById: userId,
        images: imagesData,
      },
      include,
    );
  }
  /**
   * List products with filters and relations
   */
  public async findMany(
    filters: any = {},
    pagination?: Partial<PaginationOptions>,
    orderBy?: any,
    include?: any,
  ) {
    return super.findMany(filters, pagination, orderBy, {
      ...include,
      images: true,
      category: true,
      subCategory: true,
    });
  }

  /**
   * Get product by ID with full relations
   */
  public async findById(id: string, include?: any) {
    return super.findById(id, {
      ...include,
      images: true,
      category: true,
      subCategory: true,
    });
  }

  public async updateProductById(
    id: string,
    data: UpdateProductInput & { deleteImageIds?: string[] },
    imageFiles?: Express.Multer.File[],
    include?: any,
  ) {
    // 1️⃣ Get existing product with images
    const existing = await this.getModel().findUnique({
      where: { id },
      include: { images: true },
    });

    if (!existing) throw new Error("Product not found");

    // 🔥 parse deleteImageIds
    let deleteIds: string[] = [];

    if (data.deleteImageIds) {
      if (typeof data.deleteImageIds === "string") {
        try {
          deleteIds = JSON.parse(
            (data.deleteImageIds as string).replace(/'/g, '"'),
          );
        } catch {
          throw new Error("Invalid deleteImageIds format");
        }
      } else {
        deleteIds = data.deleteImageIds;
      }
    }

    let imagesData: any = undefined;

    // 2️⃣ Delete specific images
    if (deleteIds.length > 0) {
      const imagesToDelete = existing.images.filter((img: any) =>
        deleteIds.includes(img.id),
      );

      // 🔥 delete from local storage
      await Promise.all(
        imagesToDelete.map(async (img: any) => {
          if (img.publicId) {
            await deleteLocalFile(img.publicId, "products");
          }
        }),
      );

      // ✅ FIXED (use deleteIds)
      imagesData = {
        deleteMany: {
          id: {
            in: deleteIds,
          },
        },
      };
    }

    // 3️⃣ Upload new images
    if (imageFiles && imageFiles.length > 0) {
      const uploadPromises = imageFiles.map((file, index) =>
        uploadToLocal(
          `${data.name || existing.name}-${Date.now()}-${index}`,
          file.path,
          "products",
        ),
      );

      const uploadedResults = await Promise.all(uploadPromises);

      imagesData = {
        ...(imagesData || {}),
        create: uploadedResults.map((uploaded) => ({
          url: uploaded.url,
          publicId: uploaded.publicId,
          type: "product",
        })),
      };
    }

    // 4️⃣ Slug update
    let updatedSlug = undefined;
    if (data.name && data.name !== existing.name) {
      updatedSlug = await this.generateUniqueSlug(data.name);
    }

    // 🔥 NEW: prepare clean update data
    const updateData: any = { ...data };

    // ✅ RELATION FIX
    if (data.categoryId) {
      updateData.category = {
        connect: { id: data.categoryId },
      };
      delete updateData.categoryId;
    }

    if (data.subCategoryId) {
      updateData.subCategories = {
        connect: { id: data.subCategoryId },
      };
      delete updateData.subCategoryId;
    }

    // ✅ remove unwanted field
    delete updateData.deleteImageIds;

    // ✅ slug
    if (updatedSlug) {
      updateData.slug = updatedSlug;
    }

    // ✅ images
    if (imagesData) {
      updateData.images = imagesData;
    }

    // 5️⃣ Final update
    return super.updateById(id, updateData, include);
  }

  /**
   * Toggle soft delete status
   */
  public async deleteById(id: string, isDeleted: boolean = true) {
    // 1️⃣ Get product with images
    const existing = await this.getModel().findUnique({
      where: { id },
      include: { images: true },
    });

    if (!existing) {
      throw new Error("Product not found");
    }

    // 2️⃣ Delete images from local storage
    if (existing.images?.length) {
      await Promise.all(
        existing.images.map(async (img: any) => {
          if (img.publicId) {
            await deleteLocalFile(img.publicId, "products");
          }
        }),
      );
    }

    // 3️⃣ Delete images from DB
    await this.getModel().update({
      where: { id },
      data: {
        images: {
          deleteMany: {},
        },
      },
    });

    return super.deleteById(id);
  }

  /**
   * Check if product exists based on filters
   */
  public async exists(filters: any) {
    return super.exists(filters);
  }

  // =========================================================================
  // Customization Methods
  // =========================================================================

  public async getCustomizationConfig(slug: string) {
    const product = await this.getModel().findUnique({
      where: { slug, isDeleted: false },
      include: {
        customizationOptions: {
          include: {
            choices: true,
          },
        },
      },
    });

    if (!product) throw new Error("Product not found");

    return {
      isCustomizable: product.isCustomizable,
      options: product.customizationOptions,
    };
  }

  public async addCustomizationOption(
    productId: string,
    data: { name: string; type: string; required: boolean },
  ) {
    return (this.prisma as any).productCustomizationOption.create({
      data: {
        productId,
        ...data,
      },
    });
  }

  public async updateCustomizationOption(optionId: string, data: any) {
    return (this.prisma as any).productCustomizationOption.update({
      where: { id: optionId },
      data,
    });
  }

  public async deleteCustomizationOption(optionId: string) {
    return (this.prisma as any).productCustomizationOption.delete({
      where: { id: optionId },
    });
  }

  public async addCustomizationChoice(
    optionId: string,
    data: { value: string },
  ) {
    return (this.prisma as any).productCustomizationChoice.create({
      data: {
        optionId,
        ...data,
      },
    });
  }

  public async updateCustomizationChoice(choiceId: string, data: any) {
    return (this.prisma as any).productCustomizationChoice.update({
      where: { id: choiceId },
      data,
    });
  }

  public async deleteCustomizationChoice(choiceId: string) {
    return (this.prisma as any).productCustomizationChoice.delete({
      where: { id: choiceId },
    });
  }
}
