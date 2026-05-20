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

  // =========================================================================
  // Customization Endpoints
  // =========================================================================

  public getCustomizationConfig = async (req: Request, res: Response) => {
    const { slug } = req.params;
    this.logAction("getCustomizationConfig", req, { slug });

    try {
      const result = await this.service.getCustomizationConfig(slug);
      return this.sendResponse(
        res,
        "Customization config retrieved successfully",
        HTTPStatusCode.OK,
        result
      );
    } catch (error: any) {
      return this.sendResponse(
        res,
        error.message,
        HTTPStatusCode.NOT_FOUND
      );
    }
  };

  public addCustomizationOption = async (req: Request, res: Response) => {
    const { productId } = req.params;
    const body = req.validatedBody;
    this.logAction("addCustomizationOption", req, { productId, body });

    const result = await this.service.addCustomizationOption(productId, body);
    return this.sendCreatedResponse(res, result, "Customization option added successfully");
  };

  public updateCustomizationOption = async (req: Request, res: Response) => {
    const { optionId } = req.params;
    const body = req.validatedBody;
    this.logAction("updateCustomizationOption", req, { optionId, body });

    const result = await this.service.updateCustomizationOption(optionId, body);
    return this.sendResponse(res, "Customization option updated successfully", HTTPStatusCode.OK, result);
  };

  public deleteCustomizationOption = async (req: Request, res: Response) => {
    const { optionId } = req.params;
    this.logAction("deleteCustomizationOption", req, { optionId });

    await this.service.deleteCustomizationOption(optionId);
    return this.sendResponse(res, "Customization option deleted successfully", HTTPStatusCode.OK);
  };

  public addCustomizationChoice = async (req: Request, res: Response) => {
    const { optionId } = req.params;
    const body = req.validatedBody;
    this.logAction("addCustomizationChoice", req, { optionId, body });

    const result = await this.service.addCustomizationChoice(optionId, body);
    return this.sendCreatedResponse(res, result, "Customization choice added successfully");
  };

  public updateCustomizationChoice = async (req: Request, res: Response) => {
    const { choiceId } = req.params;
    const body = req.validatedBody;
    this.logAction("updateCustomizationChoice", req, { choiceId, body });

    const result = await this.service.updateCustomizationChoice(choiceId, body);
    return this.sendResponse(res, "Customization choice updated successfully", HTTPStatusCode.OK, result);
  };

  public deleteCustomizationChoice = async (req: Request, res: Response) => {
    const { choiceId } = req.params;
    this.logAction("deleteCustomizationChoice", req, { choiceId });

    await this.service.deleteCustomizationChoice(choiceId);
    return this.sendResponse(res, "Customization choice deleted successfully", HTTPStatusCode.OK);
  };
}
