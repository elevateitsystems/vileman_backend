import { Router, Request, Response } from "express";
import { CategoryController } from "./category.controller";
import { CategoryValidation } from "./category.validation";
import { validateRequest } from "@/middleware/validation";
import { asyncHandler } from "@/middleware/asyncHandler";
import { upload } from "@/utils/multer";
import { authenticate, authorize } from "@/middleware/auth";

export class CategoryRoutes {
  private router: Router;
  private controller: CategoryController;

  constructor(controller: CategoryController) {
    this.router = Router();
    this.controller = controller;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    const createValidator = validateRequest({
      body: CategoryValidation.create,
    });
    const updateValidator = validateRequest({
      params: CategoryValidation.params.id,
      body: CategoryValidation.update,
    });
    const idValidator = validateRequest({
      params: CategoryValidation.params.id,
    });
    const listValidator = validateRequest({
      query: CategoryValidation.query.list,
    });
    // Define Routes
    this.router.post(
      "/",
      upload.single("image"),
      authenticate,
      // authorize("admin"),
      createValidator,
      asyncHandler((req, res) => this.controller.create(req, res)),
    );
    this.router.get(
      "/",
      listValidator,
      asyncHandler((req, res) => this.controller.getAll(req, res)),
    );
    this.router.get(
      "/:id",
      idValidator,
      asyncHandler((req, res) => this.controller.getOne(req, res)),
    );
    this.router.patch(
      "/:id",
      authenticate,
      // authorize("admin"),
      updateValidator,
      asyncHandler((req, res) => this.controller.update(req, res)),
    );
    this.router.put(
      "/:id",
      authenticate,
      authorize("admin"),
      idValidator,
      asyncHandler((req, res) => this.controller.delete(req, res)),
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
