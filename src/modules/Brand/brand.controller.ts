import { Request, Response } from "express";
import { BaseController } from "@/core/BaseController";
import { BrandService } from "./brand.service";
import { HTTPStatusCode } from "@/types/HTTPStatusCode";

export class BrandController extends BaseController {
  constructor(private service: BrandService) {
    super();
  }

  /**
   * Create a new Brand
   */
  public create = async (req: Request, res: Response) => {
    const body = req.validatedBody;
    const userId = (req as any).user?.id; // from JWT middleware
    const imageFile = req.file;
    this.logAction("create", req, { body });

    const result = await this.service.create(body, userId, imageFile);

    return this.sendCreatedResponse(res, result, "Brand created successfully");
  };

  /**
   * Get all Brands
   */
  public getAll = async (req: Request, res: Response) => {
    const pagination = this.extractPaginationParams(req);
    this.logAction("getAll", req, { pagination });

    const result = await this.service.findMany({}, pagination);

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
      "Brands retrieved successfully",
      result.data,
    );
  };

  /**
   * Get single Brand
   */
  public getOne = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    this.logAction("getOne", req, { id });

    const result = await this.service.findById(id);

    if (!result) {
      return this.sendResponse(
        res,
        "Brand not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    return this.sendResponse(
      res,
      "Brand retrieved successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  /**
   * Update Brand
   */
  public update = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    const body = req.validatedBody;
    const imageFile = req.file;
    this.logAction("update", req, { id, body });

    const exists = await this.service.exists({ id });
    if (!exists) {
      return this.sendResponse(
        res,
        "Brand not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    const result = await this.service.updateById(id, body, imageFile);

    return this.sendResponse(
      res,
      "Brand updated successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  /**
   * Delete Brand
   */
  public delete = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    this.logAction("delete", req, { id });

    const exists = await this.service.exists({ id });
    if (!exists) {
      return this.sendResponse(
        res,
        "Brand not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    await this.service.deleteById(id);

    return this.sendResponse(
      res,
      "Brand deleted successfully",
      HTTPStatusCode.OK,
    );
  };
}
