import { BaseModule } from '@/core/BaseModule';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { ProductRoutes } from './product.routes';

export class ProductModule extends BaseModule {
    public readonly name = 'ProductModule';
    public readonly version = '1.0.0';
    // Add dependencies if this module relies on others
    public readonly dependencies = []; 

    private service!: ProductService;
    private controller!: ProductController;
    private routes!: ProductRoutes;

    protected async setupServices(): Promise<void> {
        this.service = new ProductService(this.context.prisma);
    }

    protected async setupRoutes(): Promise<void> {
        this.controller = new ProductController(this.service);
        this.routes = new ProductRoutes(this.controller);

        this.router.use('/api/products', this.routes.getRouter());
    }
}
