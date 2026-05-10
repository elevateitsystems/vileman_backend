import { Request, Response } from "express";
import { BaseController } from "@/core/BaseController";
import { UserService } from "./user.service";
import { HTTPStatusCode } from "@/types/HTTPStatusCode";
import { User, UserRole } from "@/generated/prisma/browser";

export class UserController extends BaseController {
  constructor(private service: UserService) {
    super();
  }

  /**
   * Get all Users (list)
   */
  public getAll = async (req: Request, res: Response) => {
    const query = req.validatedQuery;
    const pagination = this.extractPaginationParams(req);
    const { sortBy, sortOrder, search, isDeleted, role } = query;
    const filters: any = { isDeleted };
    console.log({ query });
    if (search) {
      filters.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
        { displayName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const orderBy = {
      [sortBy]: sortOrder,
    };

    if (role) {
      filters.role = role;
    }

    const result = await this.service.findMany(filters, pagination, orderBy);

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
      "Users retrieved successfully",
      result.data,
    );
  };

  public analytics = async (req: Request, res: Response) => {
    const query = req.validatedQuery;
    const { startDate, endDate } = query;
    const result = await this.service.analytics(
      startDate as string,
      endDate as string,
    );

    return this.sendResponse(
      res,
      "User analytics retrieved successfully",
      HTTPStatusCode.OK,
      result,
    );
  };
  /**
   * Get single User
   */
  public getOne = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;

    const result = await this.service.findById(id);

    if (!result) {
      return this.sendResponse(res, "User not found", HTTPStatusCode.NOT_FOUND);
    }

    return this.sendResponse(
      res,
      "User retrieved successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  /**
   * Get single User
   */
  public getMyProfile = async (req: Request, res: Response) => {
    const id = req.userId;
    if (!id) {
      return this.sendResponse(
        res,
        "User ID missing in token",
        HTTPStatusCode.BAD_REQUEST,
      );
    }
    const result = await this.service.findById(id);

    if (!result) {
      return this.sendResponse(res, "User not found", HTTPStatusCode.NOT_FOUND);
    }

    return this.sendResponse(
      res,
      "User retrieved successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  /**
   * Update User
   */
  public updateProfile = async (req: Request, res: Response) => {
    const id = req.userId;
    const body = req.validatedBody;
    const avatarFile = req.file;
    const exists = await this.service.exists({ id });
    if (!exists) {
      return this.sendResponse(res, "User not found", HTTPStatusCode.NOT_FOUND);
    }

    const result = await this.service.updateUser(id!, body, avatarFile);

    return this.sendResponse(
      res,
      "User updated successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  /**
   * Update any User (Admin only)
   */
  public update = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    const body = req.validatedBody;
    const avatarFile = req.file;

    const exists = await this.service.exists({ id });
    if (!exists) {
      return this.sendResponse(res, "User not found", HTTPStatusCode.NOT_FOUND);
    }

    const result = await this.service.updateUser(id, body, avatarFile);

    return this.sendResponse(
      res,
      "User updated successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  /**
   * Delete User
   */
  public softDelete = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    const body = req.validatedBody;
    const exists = await this.service.exists({ id });
    if (!exists) {
      return this.sendResponse(res, "User not found", HTTPStatusCode.NOT_FOUND);
    }

    await this.service.softDelete({
      id,
      isDeleted: body?.isDeleted,
    });

    return this.sendResponse(
      res,
      `User ${body?.isDeleted ? "deleted" : "restored"} successfully`,
      HTTPStatusCode.OK,
    );
  };
}
