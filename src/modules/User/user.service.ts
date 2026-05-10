import { BaseService } from "@/core/BaseService";
import { PrismaClient, UserRole } from "@/generated/prisma/client";
import { PaginationOptions } from "@/types/types";
import { UpdateUserInput } from "./user.validation";
import { User } from "@/generated/prisma/client";
import { NotFoundError } from "@/core/errors/AppError";
import { AppLogger } from "@/core/logging/logger";
export class UserService extends BaseService<any, UpdateUserInput> {
  constructor(prisma: PrismaClient) {
    super(prisma, "User", {
      enableSoftDelete: true,
      enableAuditFields: true,
    });
  }

  protected getModel() {
    return this.prisma.user;
  }

  public async findMany(
    filters: any = {},
    pagination?: Partial<PaginationOptions>,
    orderBy?: any,
    include?: any,
  ) {
    console.log({ filters });
    return super.findMany(filters, pagination, orderBy, include);
  }

  public async analytics(startDate?: string, endDate?: string) {
    const where: any = {};

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        createdAt: true,
      },
    });

    // Group by date manually
    const grouped: Record<string, number> = {};

    users.forEach((user) => {
      const date = user.createdAt.toISOString().split("T")[0];

      grouped[date] = (grouped[date] || 0) + 1;
    });

    return Object.entries(grouped).map(([date, count]) => ({
      date,
      count,
    }));
  }

  public async findById(id: string, include?: any) {
    return super.findById(id, include);
  }

  async updateUser(
    userId: string | undefined,
    data: UpdateUserInput,
    avatarFile?: Express.Multer.File,
  ): Promise<Omit<User, "password">> {
    if (!userId) {
      throw new NotFoundError("User ID is required");
    }
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    let avatarUrl = undefined;
    if (avatarFile?.path) {
      // const uploadedAvatarUrl = await sendImageToCloudinary(
      //   `${data.firstName || user.firstName}_${data.lastName || user.lastName}`,
      //   avatarFile.path,
      //   "user_avatars",
      // );
      // avatarUrl = uploadedAvatarUrl.secure_url;
    }

    const updateData: any = {};
    if (data.email !== undefined) updateData.email = data.email;
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.username !== undefined) updateData.username = data.username;
    if (data.designation !== undefined)
      updateData.designation = data.designation;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.modules !== undefined) updateData.modules = data.modules;
    if (avatarUrl) updateData.avatarUrl = avatarUrl;

    // Calculate display name if names changed
    if (data.firstName !== undefined || data.lastName !== undefined) {
      const firstName = data.firstName ?? user.firstName;
      const lastName = data.lastName ?? user.lastName;
      updateData.displayName = `${firstName} ${lastName}`;
    }

    const updatedUser = await this.updateById(userId, updateData);

    AppLogger.info("User updated", { userId });

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Update user role
   */
  async updateUserRole(
    userId: string,
    newRole: UserRole,
    // newStatus: UserAccountStatus,
  ): Promise<Omit<User, "password">> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const updatedUser = await this.updateById(userId, {
      role: newRole,
      // status: newStatus,
    });

    AppLogger.info("User role updated", {
      userId,
      oldRole: user.role,
      newRole,
    });

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  public async softDelete(data: any): Promise<any> {
    const { id, isDeleted } = data;
    console.log({ isDeleted });
    return super.updateById(id, {
      isDeleted: isDeleted,
    });
  }

  public async exists(filters: any) {
    return super.exists(filters);
  }
}
