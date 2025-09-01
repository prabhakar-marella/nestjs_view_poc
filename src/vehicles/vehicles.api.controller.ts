import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/vehicles')
export class VehiclesApiController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getVehicles() {
    return this.prisma.vehicle.findMany({ take: 20 });
  }
}