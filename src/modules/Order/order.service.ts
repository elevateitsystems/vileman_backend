import { BaseService } from "@/core/BaseService";
import { PrismaClient } from "@/generated/prisma/client";
import { stripe } from "@/lib/stripe";
import { config } from "@/core/config";
import { AppError } from "@/core/errors/AppError";
import { HTTPStatusCode } from "@/types/HTTPStatusCode";
import { CheckoutInput } from "./order.validation";
import { AppLogger } from "@/core/logging/logger";

export class OrderService extends BaseService<any, any, any> {
  constructor(prisma: PrismaClient) {
    super(prisma, "Order", {
      enableAuditFields: true,
    });
  }

  protected getModel() {
    return (this.prisma as any).order;
  }

  /**
   * Create Stripe Checkout Session
   */
  public async createCheckoutSession(data: CheckoutInput) {
    const { products, customerEmail, customerPhone } = data;

    // 1. Fetch products and validate prices
    const productIds = products.map((p) => p.productId);
    const dbProducts = await (this.prisma as any).product.findMany({
      where: {
        id: { in: productIds },
        isDeleted: false,
      },
    });

    if (dbProducts.length !== products.length) {
      throw new AppError(
        HTTPStatusCode.BAD_REQUEST,
        "One or more products not found or inactive",
        "PRODUCT_NOT_FOUND",
      );
    }

    // 2. Prepare line items
    const lineItems = products.map((item) => {
      const product = dbProducts.find((p: any) => p.id === item.productId);
      if (!product) {
        throw new AppError(
          HTTPStatusCode.BAD_REQUEST,
          `Product ${item.productId} not found`,
          "PRODUCT_NOT_FOUND",
        );
      }

      // Calculate price (discountPrice if available, else price)
      const unitPrice = product.discountPrice || product.price;

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            description: product.description || undefined,
            metadata: {
              productId: product.id,
            },
          },
          unit_amount: Math.round(Number(unitPrice) * 100), // Convert to cents
        },
        quantity: item.quantity,
      };
    });

    // 3. Create Stripe Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: customerEmail,
      line_items: lineItems,
      success_url: `${config.server.clientUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.server.clientUrl}/cancel`,
      metadata: {
        customerEmail,
        customerPhone,
        // Store product info in metadata as stringified JSON (careful with size limits)
        products: JSON.stringify(
          products.map((p) => ({ id: p.productId, q: p.quantity })),
        ),
      },
    });

    return { url: session.url };
  }

  /**
   * Handle Stripe Webhook
   */
  public async handleWebhook(sig: string, rawBody: Buffer) {
    let event;

    try {
      event = await stripe.webhooks.constructEventAsync(
        rawBody,
        sig,
        config.stripe.webhookSecret!,
      );
    } catch (err: any) {
      AppLogger.error(`Webhook signature verification failed: ${err.message}`);
      throw new AppError(
        HTTPStatusCode.BAD_REQUEST,
        `Webhook Error: ${err.message}`,
        "WEBHOOK_ERROR",
      );
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      await this.saveOrder(session);
    }

    return { received: true };
  }

  /**
   * Save Order to Database
   */
  private async saveOrder(session: any) {
    const customerEmail = session.metadata.customerEmail;
    const customerPhone = session.metadata.customerPhone;
    const products = JSON.parse(session.metadata.products);
    const stripeSessionId = session.id;
    const totalAmount = session.amount_total / 100; // Convert back from cents

    // Get product details to store prices at time of order
    const dbProducts = await (this.prisma as any).product.findMany({
      where: {
        id: { in: products.map((p: any) => p.id) },
      },
    });

    await this.prisma.$transaction(async (tx) => {
      const order = await (tx as any).order.create({
        data: {
          totalAmount,
          customerEmail,
          customerPhone,
          stripeSessionId,
          paymentStatus: "paid",
          items: {
            create: products.map((p: any) => {
              const product = dbProducts.find((dbP: any) => dbP.id === p.id);
              const price = product.discountPrice || product.price;
              return {
                productId: p.id,
                quantity: p.q,
                price: price,
              };
            }),
          },
        },
      });

      // Optionally decrease stock here
      for (const p of products) {
        await (tx as any).product.update({
          where: { id: p.id },
          data: {
            stock: { decrement: p.q },
          },
        });
      }

      AppLogger.info(
        `Order ${order.id} saved successfully for session ${stripeSessionId}`,
      );
    });
  }

  /**
   * Get all orders with pagination and filters
   */
  public async getAllOrders(filters: any = {}, pagination?: any) {
    return this.findMany(filters, pagination, { createdAt: "desc" }, {
      items: {
        include: { product: true },
      },
    });
  }

  /**
   * Get single order by ID
   */
  public async getOrderById(id: string) {
    const order = await this.findById(id, {
      items: {
        include: { product: true },
      },
    });
    if (!order) {
      throw new AppError(
        HTTPStatusCode.NOT_FOUND,
        "Order not found",
        "ORDER_NOT_FOUND",
      );
    }
    return order;
  }

  /**
   * Update order status or details
   */
  public async updateOrder(id: string, data: any) {
    return this.updateById(id, data);
  }

  /**
   * Delete order
   */
  public async deleteOrder(id: string) {
    return this.deleteById(id);
  }
}
