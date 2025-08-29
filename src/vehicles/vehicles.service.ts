import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VehicleDto } from '../dto/vehicle.dto';
import { $Enums } from '@prisma/client';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<VehicleDto[]> {
    const vehicles = await this.prisma.vehicle.findMany();

    // Map DB rows into DTOs with explicit enum typing
    return vehicles.map((v) => ({
      id: v.id,
      make: v.make,
      model: v.model,
      year: v.year,
      veh_listing_type: v.veh_listing_type as $Enums.VehListingType,
    }));
  }
}
