import { Router, Request, Response } from "express";
import { BrandController } from "./brand.controller";
import { BrandValidation } from "./brand.validation";
import { validateRequest } from "@/middleware/validation";
import { asyncHandler } from "@/middleware/asyncHandler";
import { authenticate, authorize } from "@/middleware/auth";
import { upload } from "@/utils/multer";

export class BrandRoutes {
  private router: Router;
  private controller: BrandController;

  constructor(controller: BrandController) {
    this.router = Router();
    this.controller = controller;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    const createValidator = validateRequest({ body: BrandValidation.create });
    const updateValidator = validateRequest({
      params: BrandValidation.params.id,
      body: BrandValidation.update,
    });
    const idValidator = validateRequest({ params: BrandValidation.params.id });

    // Define Routes
    this.router.post(
      "/",
      authenticate,
      authorize("admin"),
      upload.single("image"),
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
      upload.single("image"),
      updateValidator,
      asyncHandler((req, res) => this.controller.update(req, res)),
    );
    this.router.delete(
      "/:id",
      idValidator,
      authenticate,
      authorize("admin"),
      asyncHandler((req, res) => this.controller.delete(req, res)),
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
