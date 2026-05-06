import { PrismaClient } from "@/generated/prisma/client";

export class CartService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get or create a cart for a user or guest
   */
  public async getOrCreateCart(userId?: string, guestId?: string) {
    if (!userId && !guestId) {
      throw new Error("Either userId or guestId is required to access a cart");
    }

    if (userId) {
      // Find cart by userId
      let cart = await this.prisma.cart.findUnique({
        where: { userId },
        include: { items: { include: { product: { include: { images: true } } } } },
      });

      if (!cart) {
        cart = await this.prisma.cart.create({
          data: { userId },
          include: { items: { include: { product: { include: { images: true } } } } },
        });
      }
      return cart;
    } else {
      // Find cart by guestId
      let cart = await this.prisma.cart.findUnique({
        where: { guestId },
        include: { items: { include: { product: { include: { images: true } } } } },
      });

      if (!cart) {
        cart = await this.prisma.cart.create({
          data: { guestId },
          include: { items: { include: { product: { include: { images: true } } } } },
        });
      }
      return cart;
    }
  }

  /**
   * Add or Increment item in cart
   */
  public async addItem(cartId: string, productId: string, quantity: number) {
    // Check if product exists and has stock
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) throw new Error("Product not found");
    if (product.stock < quantity) throw new Error("Not enough stock available");

    // Upsert cart item
    return await this.prisma.cartItem.upsert({
      where: {
        cartId_productId: { cartId, productId },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        cartId,
        productId,
        quantity,
      },
    });
  }

  /**
   * Update quantity of an item
   */
  public async updateItem(cartId: string, productId: string, quantity: number) {
    if (quantity <= 0) {
      return await this.removeItem(cartId, productId);
    }

    // Check stock
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new Error("Product not found");
    if (product.stock < quantity) throw new Error("Not enough stock available");

    return await this.prisma.cartItem.update({
      where: {
        cartId_productId: { cartId, productId },
      },
      data: { quantity },
    });
  }

  /**
   * Remove item from cart
   */
  public async removeItem(cartId: string, productId: string) {
    return await this.prisma.cartItem.delete({
      where: {
        cartId_productId: { cartId, productId },
      },
    });
  }

  /**
   * Merge guest cart into user cart upon login
   */
  public async mergeCart(guestId: string, userId: string) {
    const guestCart = await this.prisma.cart.findUnique({
      where: { guestId },
      include: { items: true },
    });

    if (!guestCart || guestCart.items.length === 0) return;

    const userCart = await this.getOrCreateCart(userId);

    for (const item of guestCart.items) {
      await this.prisma.cartItem.upsert({
        where: {
          cartId_productId: { cartId: userCart.id, productId: item.productId },
        },
        update: {
          quantity: { increment: item.quantity },
        },
        create: {
          cartId: userCart.id,
          productId: item.productId,
          quantity: item.quantity,
        },
      });
    }

    // Delete guest cart after merge
    await this.prisma.cart.delete({ where: { id: guestCart.id } });
  }

  /**
   * Clear entire cart
   */
  public async clearCart(cartId: string) {
    return await this.prisma.cartItem.deleteMany({
      where: { cartId },
    });
  }
}
