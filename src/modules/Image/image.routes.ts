import { Router, Request, Response } from "express";
import { ImageController } from "./image.controller";
import { ImageValidation } from "./image.validation";
import { validateRequest } from "@/middleware/validation";
import { asyncHandler } from "@/middleware/asyncHandler";
import { upload } from "@/utils/multer";

export class ImageRoutes {
  private router: Router;
  private controller: ImageController;

  constructor(controller: ImageController) {
    this.router = Router();
    this.controller = controller;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    const createValidator = validateRequest({ body: ImageValidation.create });
    const updateValidator = validateRequest({
      params: ImageValidation.params.id,
      body: ImageValidation.update,
    });
    const idValidator = validateRequest({ params: ImageValidation.params.id });

    // Define Routes
    this.router.post(
      "/",
      upload.array("images", 10),
      //   createValidator,
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
      updateValidator,
      asyncHandler((req, res) => this.controller.update(req, res)),
    );
    this.router.delete(
      "/:id",
      idValidator,
      asyncHandler((req, res) => this.controller.delete(req, res)),
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
