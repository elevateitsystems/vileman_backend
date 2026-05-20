import { Router } from "express";
import { ProductController } from "./product.controller";
import { ProductValidation, ProductCustomizationValidation } from "./product.validation";
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
    
    const createOptionValidator = validateRequest({
      body: ProductCustomizationValidation.createOption,
    });
    const updateOptionValidator = validateRequest({
      body: ProductCustomizationValidation.updateOption,
    });
    const createChoiceValidator = validateRequest({
      body: ProductCustomizationValidation.createChoice,
    });
    const updateChoiceValidator = validateRequest({
      body: ProductCustomizationValidation.updateChoice,
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
      "/:slug/customization",
      asyncHandler((req, res) => this.controller.getCustomizationConfig(req, res)),
    );

    this.router.get(
      "/:id",
      idValidator,
      asyncHandler((req, res) => this.controller.getOne(req, res)),
    );

    // Customization Management Routes (Admin)
    this.router.post(
      "/:productId/customization-options",
      authenticate,
      authorize("admin"),
      createOptionValidator,
      asyncHandler((req, res) => this.controller.addCustomizationOption(req, res)),
    );

    this.router.patch(
      "/customization-options/:optionId",
      authenticate,
      authorize("admin"),
      updateOptionValidator,
      asyncHandler((req, res) => this.controller.updateCustomizationOption(req, res)),
    );

    this.router.delete(
      "/customization-options/:optionId",
      authenticate,
      authorize("admin"),
      asyncHandler((req, res) => this.controller.deleteCustomizationOption(req, res)),
    );

    this.router.post(
      "/customization-options/:optionId/choices",
      authenticate,
      authorize("admin"),
      createChoiceValidator,
      asyncHandler((req, res) => this.controller.addCustomizationChoice(req, res)),
    );

    this.router.patch(
      "/customization-choices/:choiceId",
      authenticate,
      authorize("admin"),
      updateChoiceValidator,
      asyncHandler((req, res) => this.controller.updateCustomizationChoice(req, res)),
    );

    this.router.delete(
      "/customization-choices/:choiceId",
      authenticate,
      authorize("admin"),
      asyncHandler((req, res) => this.controller.deleteCustomizationChoice(req, res)),
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
