import { Request, Response } from "express";
import { BaseController } from "@/core/BaseController";
import { CategoryService } from "./category.service";
import { HTTPStatusCode } from "@/types/HTTPStatusCode";

export class CategoryController extends BaseController {
  constructor(private service: CategoryService) {
    super();
  }

  /**
   * Create a new Category
   */

  public create = async (req: Request, res: Response) => {
    const body = req.validatedBody;
    const userId = (req as any).user?.id; // from JWT middleware
    const imageFile = req.file; // from multer middleware
    this.logAction("create", req, { body, userId, imageFile });

    const result = await this.service.createCategory(body, userId, imageFile);

    return this.sendCreatedResponse(
      res,
      result,
      "Categories created successfully",
    );
  };
  /**
   * Get all Categorys
   */
  public getAll = async (req: Request, res: Response) => {
    const pagination = this.extractPaginationParams(req);
    this.logAction("getAll", req, { pagination });
    const query = req.validatedQuery || req.query;
    const { search, isDeleted } = query;
    const filters: any = {};
    if (search) {
      filters.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (typeof isDeleted !== "undefined") {
      filters.isDeleted = isDeleted;
    }
    const result = await this.service.findMany(filters, pagination);
    console.log({ result });
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
      "Categorys retrieved successfully",
      result.data,
    );
  };

  /**
   * Get single Category
   */
  public getOne = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    this.logAction("getOne", req, { id });

    const result = await this.service.findById(id);

    if (!result) {
      return this.sendResponse(
        res,
        "Category not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    return this.sendResponse(
      res,
      "Category retrieved successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  /**
   * Update Category
   */
  public update = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    const body = req.validatedBody;

    this.logAction("update", req, { id, body });

    const exists = await this.service.exists({ id });
    if (!exists) {
      return this.sendResponse(
        res,
        "Category not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    const result = await this.service.updateCategoryById(id, body);

    return this.sendResponse(
      res,
      "Category updated successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  /**
   * Delete Category
   */
  public delete = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    this.logAction("delete", req, { id });
    const { isDeleted } = req.body;
    const exists = await this.service.exists({ id });
    if (!exists) {
      return this.sendResponse(
        res,
        "Category not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    await this.service.deleteById(id, isDeleted);

    return this.sendResponse(
      res,
      "Category deleted successfully",
      HTTPStatusCode.OK,
    );
  };
}
