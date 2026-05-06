import { Request, Response, NextFunction } from "express";
import { CartService } from "./cart.service";
import { RequestWithUser } from "@/middleware/auth";

export class CartController {
  private cartService: CartService;

  constructor(cartService: CartService) {
    this.cartService = cartService;
  }

  private getGuestId(req: Request): string | undefined {
    return req.headers["x-guest-id"] as string | undefined;
  }

  /**
   * Get current cart
   */
  public getCart = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const cart = await this.cartService.getOrCreateCart(req.userId, this.getGuestId(req));
      res.status(200).json({
        success: true,
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Add item to cart
   */
  public addItem = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { productId, quantity } = req.body;
      const cart = await this.cartService.getOrCreateCart(req.userId, this.getGuestId(req));
      const item = await this.cartService.addItem(cart.id, productId, quantity);
      
      res.status(200).json({
        success: true,
        message: "Item added to cart",
        data: item,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update item quantity
   */
  public updateItem = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { productId, quantity } = req.body;
      const cart = await this.cartService.getOrCreateCart(req.userId, this.getGuestId(req));
      const item = await this.cartService.updateItem(cart.id, productId, quantity);

      res.status(200).json({
        success: true,
        message: "Cart updated",
        data: item,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Remove item from cart
   */
  public removeItem = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { productId } = req.params;
      const cart = await this.cartService.getOrCreateCart(req.userId, this.getGuestId(req));
      await this.cartService.removeItem(cart.id, productId);

      res.status(200).json({
        success: true,
        message: "Item removed from cart",
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Clear entire cart
   */
  public clearCart = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const cart = await this.cartService.getOrCreateCart(req.userId, this.getGuestId(req));
      await this.cartService.clearCart(cart.id);

      res.status(200).json({
        success: true,
        message: "Cart cleared",
      });
    } catch (error) {
      next(error);
    }
  };
}
