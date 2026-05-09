import { Request, Response } from "express";
import { BaseController } from "@/core/BaseController";
import { SubCategoryService } from "./subCategory.service";
import { HTTPStatusCode } from "@/types/HTTPStatusCode";

export class SubCategoryController extends BaseController {
  constructor(private service: SubCategoryService) {
    super();
  }

  /**
   * Create a new SubCategory
   */
  public create = async (req: Request, res: Response) => {
    const body = req.validatedBody;
    this.logAction("create", req, { body });
    const userId = (req as any).user?.id;

    const result = await this.service.create(body, userId);

    return this.sendCreatedResponse(
      res,
      result,
      "SubCategory created successfully",
    );
  };

  /**
   * Get all SubCategorys
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
      "SubCategorys retrieved successfully",
      result.data,
    );
  };

  /**
   * Get single SubCategory
   */
  public getOne = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    this.logAction("getOne", req, { id });

    const result = await this.service.findById(id);

    if (!result) {
      return this.sendResponse(
        res,
        "SubCategory not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    return this.sendResponse(
      res,
      "SubCategory retrieved successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  /**
   * Update SubCategory
   */
  public update = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    const body = req.validatedBody;
    this.logAction("update", req, { id, body });

    const exists = await this.service.exists({ id });
    if (!exists) {
      return this.sendResponse(
        res,
        "SubCategory not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    const result = await this.service.updateById(id, body);

    return this.sendResponse(
      res,
      "SubCategory updated successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  /**
   * Delete SubCategory
   */
  public delete = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    this.logAction("delete", req, { id });
    const { isDeleted } = req.body;
    const exists = await this.service.exists({ id });
    if (!exists) {
      return this.sendResponse(
        res,
        "SubCategory not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    await this.service.deleteById(id, isDeleted);

    return this.sendResponse(
      res,
      "SubCategory deleted successfully",
      HTTPStatusCode.OK,
    );
  };
}
