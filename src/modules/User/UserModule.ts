import { BaseModule } from '@/core/BaseModule';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserRoutes } from './user.routes';

export class UserModule extends BaseModule {
    public readonly name = 'UserModule';
    public readonly version = '1.0.0';
    // Add dependencies if this module relies on others
    public readonly dependencies = []; 

    private service!: UserService;
    private controller!: UserController;
    private routes!: UserRoutes;

    protected async setupServices(): Promise<void> {
        this.service = new UserService(this.context.prisma);
    }

    protected async setupRoutes(): Promise<void> {
        this.controller = new UserController(this.service);
        this.routes = new UserRoutes(this.controller);

        this.router.use('/api/users', this.routes.getRouter());
    }
}
