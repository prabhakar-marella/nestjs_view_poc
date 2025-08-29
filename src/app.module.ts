import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { VehiclesModule } from './vehicles/vehicles.module';
import { PrismaModule } from './prisma/prisma.module';
import { AppService } from './app.service';


@Module({
  imports: [PrismaModule, VehiclesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
