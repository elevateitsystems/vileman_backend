import { BaseModule } from '@/core/BaseModule';
import { ImageService } from './image.service';
import { ImageController } from './image.controller';
import { ImageRoutes } from './image.routes';

export class ImageModule extends BaseModule {
    public readonly name = 'ImageModule';
    public readonly version = '1.0.0';
    // Add dependencies if this module relies on others
    public readonly dependencies = []; 

    private service!: ImageService;
    private controller!: ImageController;
    private routes!: ImageRoutes;

    protected async setupServices(): Promise<void> {
        this.service = new ImageService(this.context.prisma);
    }

    protected async setupRoutes(): Promise<void> {
        this.controller = new ImageController(this.service);
        this.routes = new ImageRoutes(this.controller);

        this.router.use('/api/images', this.routes.getRouter());
    }
}
