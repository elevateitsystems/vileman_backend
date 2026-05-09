import { BaseModule } from '@/core/BaseModule';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { BrandRoutes } from './brand.routes';

export class BrandModule extends BaseModule {
    public readonly name = 'BrandModule';
    public readonly version = '1.0.0';
    // Add dependencies if this module relies on others
    public readonly dependencies = []; 

    private service!: BrandService;
    private controller!: BrandController;
    private routes!: BrandRoutes;

    protected async setupServices(): Promise<void> {
        this.service = new BrandService(this.context.prisma);
    }

    protected async setupRoutes(): Promise<void> {
        this.controller = new BrandController(this.service);
        this.routes = new BrandRoutes(this.controller);

        this.router.use('/api/brands', this.routes.getRouter());
    }
}
