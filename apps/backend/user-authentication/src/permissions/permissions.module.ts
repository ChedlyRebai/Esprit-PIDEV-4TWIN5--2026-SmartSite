import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { PermissionsSeedService } from './permissions.seed.service';
import { Permission, PermissionSchema } from './entities/permission.entity';
import { Role, RoleSchema } from '../roles/entities/role.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Permission.name, schema: PermissionSchema },
      { name: Role.name, schema: RoleSchema },
    ]),
  ],
  providers: [PermissionsService, PermissionsSeedService],
  controllers: [PermissionsController],
  exports: [PermissionsService],
})
export class PermissionsModule {}
