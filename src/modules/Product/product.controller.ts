import { Request, Response } from "express";
import { BaseController } from "@/core/BaseController";
import { ProductService } from "./product.service";
import { HTTPStatusCode } from "@/types/HTTPStatusCode";

export class ProductController extends BaseController {
  constructor(private service: ProductService) {
    super();
  }

  /**
   * Create a new Product
   */
  public create = async (req: Request, res: Response) => {
    const body = req.validatedBody;
    const userId = (req as any).user?.id; // from JWT middleware
    const imageFiles = req.files as Express.Multer.File[];

    this.logAction("create", req, { body, userId });

    const result = await this.service.createProduct(body, userId, imageFiles);

    return this.sendCreatedResponse(
      res,
      result,
      "Product created successfully",
    );
  };

  /**
   * Get all Products with filters
   */
  public getAll = async (req: Request, res: Response) => {
    const pagination = this.extractPaginationParams(req);
    const query = req.validatedQuery || req.query;
    const {
      search,
      categoriesId,
      subCategoriesId,
      brandId,
      minPrice,
      maxPrice,
      inStock,
      isDeleted,
    } = query;

    this.logAction("getAll", req, { pagination, query });

    const filters: any = {};

    // 🔍 Search and Filters
    if (search) {
      filters.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (categoriesId) filters.categoriesId = categoriesId;
    if (subCategoriesId) filters.subCategoriesId = subCategoriesId;
    if (brandId) filters.brandId = brandId;

    if (minPrice || maxPrice) {
      filters.price = {};
      if (minPrice) filters.price.gte = minPrice;
      if (maxPrice) filters.price.lte = maxPrice;
    }

    if (inStock !== undefined) {
      filters.stock = inStock ? { gt: 0 } : { equals: 0 };
    }

    if (typeof isDeleted !== "undefined") {
      filters.isDeleted = isDeleted;
    }

    const result = await this.service.findMany(filters, pagination);

    return this.sendPaginatedResponse(
      res,
      {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNext: result.hasNext,
        hasPrevious: result.hasPrevious,
      },
      "Products retrieved successfully",
      result.data,
    );
  };

  /**
   * Get single Product
   */
  public getOne = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    this.logAction("getOne", req, { id });

    const result = await this.service.findById(id);

    if (!result) {
      return this.sendResponse(
        res,
        "Product not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    return this.sendResponse(
      res,
      "Product retrieved successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  /**
   * Update Product
   */
  public update = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    const body = req.validatedBody;
    const imageFiles = req.files as Express.Multer.File[];

    this.logAction("update", req, { id, body });

    const exists = await this.service.exists({ id });
    if (!exists) {
      return this.sendResponse(
        res,
        "Product not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    const result = await this.service.updateProductById(id, body, imageFiles);

    return this.sendResponse(
      res,
      "Product updated successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  /**
   * Delete Product (Toggle soft delete)
   */
  public delete = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;

    this.logAction("delete", req, { id });

    const exists = await this.service.exists({ id });
    if (!exists) {
      return this.sendResponse(
        res,
        "Product not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    await this.service.deleteById(id);

    return this.sendResponse(
      res,
      "Product deleted successfully",
      HTTPStatusCode.OK,
    );
  };
}
