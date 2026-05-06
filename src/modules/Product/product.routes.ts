import { Router } from "express";
import { ProductController } from "./product.controller";
import { ProductValidation } from "./product.validation";
import { validateRequest } from "@/middleware/validation";
import { asyncHandler } from "@/middleware/asyncHandler";
import { upload } from "@/utils/multer";
import { authenticate, authorize } from "@/middleware/auth";

export class ProductRoutes {
  private router: Router;
  private controller: ProductController;

  constructor(controller: ProductController) {
    this.router = Router();
    this.controller = controller;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    const createValidator = validateRequest({
      body: ProductValidation.create,
    });
    const updateValidator = validateRequest({
      params: ProductValidation.params.id,
      body: ProductValidation.update,
    });
    const idValidator = validateRequest({
      params: ProductValidation.params.id,
    });
    const listValidator = validateRequest({
      query: ProductValidation.query.list,
    });

    // Define Routes
    this.router.post(
      "/",
      authenticate,
      // authorize("admin"),
      upload.array("images", 10), // Allow up to 10 images
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
      upload.array("images", 10),
      updateValidator,
      asyncHandler((req, res) => this.controller.update(req, res)),
    );

    // Toggle soft delete status (using PUT to match Category module pattern)
    this.router.delete(
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
