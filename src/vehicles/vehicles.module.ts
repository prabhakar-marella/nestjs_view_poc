import { Module } from '@nestjs/common';
import { VehiclesViewController } from './vehicles.view.controller';
import { VehiclesApiController } from './vehicles.api.controller';
import { VehiclesService } from './vehicles.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule], 
  controllers: [VehiclesViewController, VehiclesApiController],
  providers: [VehiclesService],
  exports: [VehiclesService],
})
export class VehiclesModule {}
