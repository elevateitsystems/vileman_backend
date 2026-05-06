import { Router } from "express";
import { CartController } from "./cart.controller";
import { addItemSchema, updateItemSchema, removeItemSchema } from "./cart.validation";
import { validateRequest } from "@/middleware/validation";
import { asyncHandler } from "@/middleware/asyncHandler";
import { optionalAuth } from "@/middleware/auth";

export class CartRoutes {
  private router: Router;
  private controller: CartController;

  constructor(controller: CartController) {
    this.router = Router();
    this.controller = controller;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // All cart routes support optional authentication
    this.router.use(optionalAuth);

    this.router.get(
      "/",
      asyncHandler(this.controller.getCart)
    );

    this.router.post(
      "/add",
      validateRequest({ body: addItemSchema }),
      asyncHandler(this.controller.addItem)
    );

    this.router.patch(
      "/update",
      validateRequest({ body: updateItemSchema }),
      asyncHandler(this.controller.updateItem)
    );

    this.router.delete(
      "/remove/:productId",
      validateRequest({ params: removeItemSchema }),
      asyncHandler(this.controller.removeItem)
    );

    this.router.delete(
      "/clear",
      asyncHandler(this.controller.clearCart)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
