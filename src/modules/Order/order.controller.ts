import { Request, Response } from "express";
import { BaseController } from "@/core/BaseController";
import { OrderService } from "./order.service";
import { CheckoutSchema } from "./order.validation";
import { asyncHandler } from "@/middleware/asyncHandler";
import { HTTPStatusCode } from "@/types/HTTPStatusCode";
import * as v from "valibot";

export class OrderController extends BaseController {
  constructor(private orderService: OrderService) {
    super();
  }

  /**
   * Create Checkout Session
   */
  public checkout = asyncHandler(async (req: Request, res: Response) => {
    const data = v.parse(CheckoutSchema, req.body);
    const result = await this.orderService.createCheckoutSession(data);
    this.sendResponse(res, "Checkout session created", HTTPStatusCode.OK, result);
  });

  /**
   * Stripe Webhook
   */
  public webhook = asyncHandler(async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;
    const rawBody = (req as any).rawBody;

    if (!sig || !rawBody) {
      return res.status(HTTPStatusCode.BAD_REQUEST).send("Missing signature or body");
    }

    const result = await this.orderService.handleWebhook(sig, rawBody);
    res.status(HTTPStatusCode.OK).json(result);
  });

  /**
   * Get all orders
   */
  public getAll = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, offset } = this.extractPaginationParams(req);
    const result = await this.orderService.getAllOrders(
      {},
      { page, limit, offset },
    );
    const { data, ...pagination } = result;
    this.sendPaginatedResponse(
      res,
      pagination,
      "Orders fetched",
      data,
    );
  });

  /**
   * Get single order
   */
  public getSingle = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.orderService.getOrderById(id);
    this.sendResponse(res, "Order fetched", HTTPStatusCode.OK, result);
  });

  /**
   * Update order
   */
  public update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.orderService.updateOrder(id, req.body);
    this.sendResponse(res, "Order updated", HTTPStatusCode.OK, result);
  });

  /**
   * Delete order
   */
  public delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await this.orderService.deleteOrder(id);
    this.sendResponse(res, "Order deleted", HTTPStatusCode.OK);
  });
}
