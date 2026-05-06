import { BaseModule } from "@/core/BaseModule";
import { SubCategoryService } from "./subCategory.service";
import { SubCategoryController } from "./subCategory.controller";
import { SubCategoryRoutes } from "./subCategory.routes";

export class SubCategoryModule extends BaseModule {
  public readonly name = "SubCategoryModule";
  public readonly version = "1.0.0";
  // Add dependencies if this module relies on others
  public readonly dependencies = [];

  private service!: SubCategoryService;
  private controller!: SubCategoryController;
  private routes!: SubCategoryRoutes;

  protected async setupServices(): Promise<void> {
    this.service = new SubCategoryService(this.context.prisma);
  }

  protected async setupRoutes(): Promise<void> {
    this.controller = new SubCategoryController(this.service);
    this.routes = new SubCategoryRoutes(this.controller);

    this.router.use("/api/sub-categories", this.routes.getRouter());
  }
}
