import { BaseModule } from "@/core/BaseModule";
import { CategoryService } from "./category.service";
import { CategoryController } from "./category.controller";
import { CategoryRoutes } from "./category.routes";

export class CategoryModule extends BaseModule {
  public readonly name = "CategoryModule";
  public readonly version = "1.0.0";
  // Add dependencies if this module relies on others
  public readonly dependencies = [];

  private service!: CategoryService;
  private controller!: CategoryController;
  private routes!: CategoryRoutes;

  protected async setupServices(): Promise<void> {
    this.service = new CategoryService(this.context.prisma);
  }

  protected async setupRoutes(): Promise<void> {
    this.controller = new CategoryController(this.service);
    this.routes = new CategoryRoutes(this.controller);

    this.router.use("/api/categories", this.routes.getRouter());
  }
}
