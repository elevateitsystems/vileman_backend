import { BaseModule } from "@/core/BaseModule";
import { OrderService } from "./order.service";
import { OrderController } from "./order.controller";
import { setupOrderRoutes } from "./order.routes";

export class OrderModule extends BaseModule {
  public readonly name = "Order";
  public readonly version = "1.0.0";
  public readonly dependencies = ["ProductModule"]; // Depends on Product module for price fetching

  private service!: OrderService;
  private controller!: OrderController;

  protected async setupServices(): Promise<void> {
    this.service = new OrderService(this.context.prisma);
  }

  protected async setupRoutes(): Promise<void> {
    this.controller = new OrderController(this.service);
    this.router.use("/api/order", setupOrderRoutes(this.controller));
  }
}
