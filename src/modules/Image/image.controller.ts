import { Request, Response } from "express";
import { BaseController } from "@/core/BaseController";
import { ImageService } from "./image.service";
import { HTTPStatusCode } from "@/types/HTTPStatusCode";

export class ImageController extends BaseController {
  constructor(private service: ImageService) {
    super();
  }

  /**
   * Create a new Image
   */
  public create = async (req: Request, res: Response) => {
    const body = req.validatedBody;
    this.logAction("create", req, { body });
    const imageFiles = req.files as Express.Multer.File[];
    const result = await this.service.upload(imageFiles);

    return this.sendCreatedResponse(res, result, "Image created successfully");
  };

  /**
   * Get all Images
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
      "Images retrieved successfully",
      result.data,
    );
  };

  /**
   * Get single Image
   */
  public getOne = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    this.logAction("getOne", req, { id });

    const result = await this.service.findById(id);

    if (!result) {
      return this.sendResponse(
        res,
        "Image not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    return this.sendResponse(
      res,
      "Image retrieved successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  /**
   * Update Image
   */
  public update = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    const body = req.validatedBody;
    this.logAction("update", req, { id, body });

    const exists = await this.service.exists({ id });
    if (!exists) {
      return this.sendResponse(
        res,
        "Image not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    const result = await this.service.updateById(id, body);

    return this.sendResponse(
      res,
      "Image updated successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  /**
   * Delete Image
   */
  public delete = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    this.logAction("delete", req, { id });

    const exists = await this.service.exists({ id });
    if (!exists) {
      return this.sendResponse(
        res,
        "Image not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    await this.service.deleteById(id);

    return this.sendResponse(
      res,
      "Image deleted successfully",
      HTTPStatusCode.OK,
    );
  };
}
