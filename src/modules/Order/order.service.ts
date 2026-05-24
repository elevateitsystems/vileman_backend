import { BaseService } from "@/core/BaseService";
import { PrismaClient } from "@/generated/prisma/client";
import { stripe } from "@/lib/stripe";
import { config } from "@/core/config";
import { AppError } from "@/core/errors/AppError";
import { HTTPStatusCode } from "@/types/HTTPStatusCode";
import { CheckoutInput } from "./order.validation";
import { AppLogger } from "@/core/logging/logger";
import { CountryService } from "@/services/country.service";
import { NodemailerEmailService } from "@/services/NodemailerEmailService";
import { uploadToLocal, deleteLocalFile } from "@/utils/localUpload";

export class OrderService extends BaseService<any, any, any> {
  private emailService: NodemailerEmailService;

  constructor(prisma: PrismaClient) {
    super(prisma, "Order", {
      enableAuditFields: true,
    });
    this.emailService = new NodemailerEmailService();
  }

  protected getModel() {
    return (this.prisma as any).order;
  }

  /**
   * Create Stripe Checkout Session
   */
  public async createCheckoutSession(
    data: CheckoutInput,
    imageFiles?: Express.Multer.File[],
  ) {
    const { products, customerEmail, customerPhone, shippingCountry } = data;

    // 1. Fetch products and validate prices
    const productIds = products.map((p) => p.productId);
    const dbProducts = await (this.prisma as any).product.findMany({
      where: {
        id: { in: productIds },
        isDeleted: false,
      },
      include: {
        customizationOptions: true,
      },
    });
    console.log(dbProducts.length, products.length);
    if (dbProducts.length !== products.length) {
      throw new AppError(
        HTTPStatusCode.BAD_REQUEST,
        "One or more products not found or inactive",
        "PRODUCT_NOT_FOUND",
      );
    }

    // 2. Calculate Delivery Charge
    const deliveryCharge =
      await CountryService.getDeliveryCharge(shippingCountry);
    let subtotal = 0;

    // 3. Prepare line items and validate customizations
    const lineItems = products.map((item) => {
      const product = dbProducts.find((p: any) => p.id === item.productId);
      if (!product) {
        throw new AppError(
          HTTPStatusCode.BAD_REQUEST,
          `Product ${item.productId} not found`,
          "PRODUCT_NOT_FOUND",
        );
      }

      // Customization validation
      if (item.customization && !product.isCustomizable) {
        throw new AppError(
          HTTPStatusCode.BAD_REQUEST,
          `Product ${product.name} is not customizable`,
          "CUSTOMIZATION_ERROR",
        );
      }

      if (product.isCustomizable && product.customizationOptions) {
        const requiredOptions = product.customizationOptions.filter(
          (opt: any) => opt.required,
        );
        const selections = item.customization?.selections || {};
        for (const reqOpt of requiredOptions) {
          if (!selections[reqOpt.name]) {
            throw new AppError(
              HTTPStatusCode.BAD_REQUEST,
              `Customization option '${reqOpt.name}' is required for ${product.name}`,
              "CUSTOMIZATION_ERROR",
            );
          }
        }
      }

      // Calculate price (discountPrice if available, else price)
      const unitPrice = product.discountPrice || product.price;
      subtotal += Number(unitPrice) * item.quantity;

      return {
        price_data: {
          currency: "eur",
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

    // 4. Add delivery charge as a line item
    lineItems.push({
      price_data: {
        currency: "eur",
        product_data: {
          name: "Delivery Charge",
          description: `Shipping to ${shippingCountry}`,
          metadata: {
            productId: "delivery",
          },
        },
        unit_amount: Math.round(deliveryCharge * 100),
      },
      quantity: 1,
    });

    // 5. Create Order in DB (unpaid)
    const orderNumber = this.generateOrderNumber();
    const order = await (this.prisma as any).order.create({
      data: {
        orderNumber,
        subtotal: Number(subtotal),
        deliveryCharge: Number(deliveryCharge),
        totalAmount: Number(subtotal) + Number(deliveryCharge),
        customerEmail,
        customerPhone,
        shippingCountry,
        stripeSessionId: "pending_" + Date.now(), // Temporary ID
        paymentStatus: "unpaid",
        items: {
          create: products.map((item) => {
            const product = dbProducts.find(
              (p: any) => p.id === item.productId,
            );
            const unitPrice = product.discountPrice || product.price;

            const createItem: any = {
              productId: item.productId,
              quantity: item.quantity,
              price: unitPrice,
            };

            if (item.customization) {
              createItem.customization = {
                create: {
                  comment: item.customization.comment,
                  selections: item.customization.selections || {},
                  images: item.customization.images || [],
                },
              };
            }
            return createItem;
          }),
        },
      },
    });

    // 6. Create Stripe Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: customerEmail,
      line_items: lineItems,
      success_url: `${config.server.clientUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.server.clientUrl}/cancel`,
      metadata: {
        orderId: order.id,
      },
    });

    // Update order with actual Stripe session ID
    await (this.prisma as any).order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
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
      await this.completeOrder(session);
    }

    return { received: true };
  }

  /**
   * Complete Order after successful payment
   */
  private async completeOrder(session: any) {
    const { orderId } = session.metadata;

    if (!orderId) {
      AppLogger.error(
        `Webhook session ${session.id} is missing orderId in metadata`,
      );
      return;
    }

    const order = await (this.prisma as any).order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!order) {
      AppLogger.error(
        `Order ${orderId} not found for webhook session ${session.id}`,
      );
      return;
    }

    if (order.paymentStatus === "paid") {
      return; // Already processed
    }

    await this.prisma.$transaction(async (tx) => {
      // Update order status
      await (tx as any).order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "paid",
        },
      });

      // Decrease stock
      for (const item of order.items) {
        await (tx as any).product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
          },
        });
      }

      AppLogger.info(`Order ${order.id} marked as paid`);

      // Send Email Notification
      await this.sendOrderConfirmationEmail(order, order.items);
    });
  }

  /**
   * Generate Unique Order Number
   */
  private generateOrderNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${dateStr}-${random}`;
  }

  /**
   * Send Order Confirmation Email
   */
  private async sendOrderConfirmationEmail(order: any, items: any[]) {
    const itemsHtml = items
      .map((item: any) => {
        const product = item.product;
        const price = item.price;
        return `
        <tr>
          <td class="product-name">${product.name}</td>
          <td style="padding: 15px 10px;">${item.quantity}</td>
          <td style="text-align: right; padding: 15px 0;">€${Number(price).toFixed(2)}</td>
        </tr>
      `;
      })
      .join("");

    await this.emailService.sendTemplatedEmail("order-confirmation", {
      to: order.customerEmail,
      subject: `Order Confirmation - ${order.orderNumber}`,
      templateData: {
        orderNumber: order.orderNumber,
        date: new Date(order.createdAt).toLocaleDateString(),
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        shippingCountry: order.shippingCountry,
        itemsHtml,
        subtotal: Number(order.subtotal).toFixed(2),
        deliveryCharge: Number(order.deliveryCharge).toFixed(2),
        totalAmount: Number(order.totalAmount).toFixed(2),
        clientUrl: config.server.clientUrl,
      },
    });
  }

  /**
   * Get all orders with pagination and filters
   */
  public async getAllOrders(filters: any = {}, pagination?: any) {
    return this.findMany(
      filters,
      pagination,
      { createdAt: "desc" },
      {
        items: {
          include: {
            product: true,
            customization: true,
          },
        },
      },
    );
  }

  /**
   * Get single order by ID
   */
  public async getOrderById(id: string) {
    const order = await this.findById(id, {
      items: {
        include: {
          product: true,
          customization: true,
        },
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
    const existingOrder = await (this.prisma as any).order.findUnique({
      where: { id },
      include: {
        items: {
          include: { customization: true },
        },
      },
    });

    const updatedOrder = await this.updateById(id, data);

    if (existingOrder) {
      const newOrder = await (this.prisma as any).order.findUnique({
        where: { id },
        include: {
          items: {
            include: { customization: true },
          },
        },
      });

      const oldImages: string[] = [];
      const newImages: Set<string> = new Set();

      existingOrder.items.forEach((item: any) => {
        if (item.customization?.images) {
          item.customization.images.forEach((img: any) => {
            if (img.publicId) oldImages.push(img.publicId);
          });
        }
      });

      if (newOrder) {
        newOrder.items.forEach((item: any) => {
          if (item.customization?.images) {
            item.customization.images.forEach((img: any) => {
              if (img.publicId) newImages.add(img.publicId);
            });
          }
        });
      }

      for (const publicId of oldImages) {
        if (!newImages.has(publicId)) {
          await deleteLocalFile(publicId, "orders");
        }
      }
    }

    return updatedOrder;
  }

  /**
   * Delete order
   */
  public async deleteOrder(id: string) {
    const existingOrder = await (this.prisma as any).order.findUnique({
      where: { id },
      include: {
        items: {
          include: { customization: true },
        },
      },
    });

    if (existingOrder) {
      for (const item of existingOrder.items) {
        if (item.customization && item.customization.images) {
          for (const img of item.customization.images) {
            if (img.publicId) {
              await deleteLocalFile(img.publicId, "orders");
            }
          }
        }
      }
    }

    return this.deleteById(id);
  }
}
