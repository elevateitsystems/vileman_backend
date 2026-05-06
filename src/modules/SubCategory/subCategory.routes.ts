import { Router, Request, Response } from "express";
import { SubCategoryController } from "./subCategory.controller";
import { SubCategoryValidation } from "./subCategory.validation";
import { validateRequest } from "@/middleware/validation";
import { asyncHandler } from "@/middleware/asyncHandler";
import { authenticate, authorize } from "@/middleware/auth";
import { upload } from "@/utils/multer";

export class SubCategoryRoutes {
  private router: Router;
  private controller: SubCategoryController;

  constructor(controller: SubCategoryController) {
    this.router = Router();
    this.controller = controller;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    const createValidator = validateRequest({
      body: SubCategoryValidation.create,
    });
    const updateValidator = validateRequest({
      params: SubCategoryValidation.params.id,
      body: SubCategoryValidation.update,
    });
    const idValidator = validateRequest({
      params: SubCategoryValidation.params.id,
    });

    // Define Routes
    this.router.post(
      "/",
      authenticate,
      // authorize("admin"),
      createValidator,
      asyncHandler((req, res) => this.controller.create(req, res)),
    );
    this.router.get(
      "/",
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
      authorize("admin"),
      // upload.single("image"),
      updateValidator,
      asyncHandler((req, res) => this.controller.update(req, res)),
    );
    this.router.put(
      "/:id",
      idValidator,
      asyncHandler((req, res) => this.controller.delete(req, res)),
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
