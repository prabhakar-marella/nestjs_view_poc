import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { $Enums } from '@prisma/client';

export type VehicleListItem = {
  id: number;
  rooftop_id: number | null;
  make: string | null;
  model: string | null;
  year: number | null;
  veh_listing_type: string | null;
  trim?: string | null;
  body_type?: string | null;
  ext_color?: string | null;
};

export type VehicleDetail = VehicleListItem & {
  engine?: string | null;
  miles?: string | null;
  status?: string | null;
  videos?: any[];
  spins?: any[];
  images?: any[];
  rooftop?: any | null;
};

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async findAll(limit = 20): Promise<VehicleListItem[]> {
    const rows = await this.prisma.vehicle.findMany({
      take: limit,
      orderBy: { id: 'asc' },
      select: {
        id: true,
        rooftopId: true,
        make: true,
        model: true,
        year: true,
        vehListingType: true,
        trim: true,
        bodyType: true,
        extColor: true,
      },
      where: {
        deletedAt: null,
      },
    });

    return rows.map((r) => ({
      id: r.id,
      rooftop_id: r.rooftopId ?? null,
      make: r.make ?? null,
      model: r.model ?? null,
      year: r.year ?? null,
      veh_listing_type: r.vehListingType ? String(r.vehListingType) : null,
      trim: r.trim ?? null,
      body_type: r.bodyType ?? null,
      ext_color: r.extColor ?? null,
    }));
  }

  async findOne(id: number): Promise<VehicleDetail | null> {
    const r = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        videos: true,
        spins: true,
        images: true,
        rooftop: true,
      },
    });
    if (!r || r.deletedAt) return null;

    return {
      id: r.id,
      rooftop_id: r.rooftopId ?? null,
      make: r.make ?? null,
      model: r.model ?? null,
      year: r.year ?? null,
      veh_listing_type: r.vehListingType ? String(r.vehListingType) : null,
      trim: r.trim ?? null,
      body_type: r.bodyType ?? null,
      ext_color: r.extColor ?? null,
      engine: r.engine ?? null,
      miles: r.miles ?? null,
      status: r.status ?? null,
      videos: r.videos ?? [],
      spins: r.spins ?? [],
      images: r.images ?? [],
      rooftop: r.rooftop
        ? {
            id: r.rooftop.id,
            name: r.rooftop.name,
            city: r.rooftop.city,
            state: r.rooftop.state,
          }
        : null,
    };
  }

  // -------------------------
  // Create
  // -------------------------
  async create(dto: CreateVehicleDto) {
    const data: any = {};

    if (dto.rooftop_id !== undefined) data.rooftopId = dto.rooftop_id;
    if (dto.make !== undefined) data.make = dto.make;
    if (dto.model !== undefined) data.model = dto.model;
    if (dto.year !== undefined) data.year = dto.year;
    if (dto.veh_listing_type !== undefined) {
      // Accept string enum; Prisma expects enum value; using $Enums works reliably
      data.vehListingType = dto.veh_listing_type as unknown as $Enums.VehListingType;
    }
    if (dto.trim !== undefined) data.trim = dto.trim;
    if (dto.body_type !== undefined) data.bodyType = dto.body_type;
    if (dto.ext_color !== undefined) data.extColor = dto.ext_color;
    if (dto.engine !== undefined) data.engine = dto.engine;
    if (dto.miles !== undefined) data.miles = dto.miles;
    if (dto.status !== undefined) data.status = dto.status;

    const created = await this.prisma.vehicle.create({ data });
    return this.findOne(created.id);
  }

  // -------------------------
  // Update (partial)
  // -------------------------
  async update(id: number, dto: UpdateVehicleDto) {
    const existing = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Vehicle not found');
    }

    const data: any = {};

    if (dto.rooftop_id !== undefined) data.rooftopId = dto.rooftop_id;
    if (dto.make !== undefined) data.make = dto.make;
    if (dto.model !== undefined) data.model = dto.model;
    if (dto.year !== undefined) data.year = dto.year;
    if (dto.veh_listing_type !== undefined) {
      data.vehListingType = dto.veh_listing_type as unknown as $Enums.VehListingType;
    }
    if (dto.trim !== undefined) data.trim = dto.trim;
    if (dto.body_type !== undefined) data.bodyType = dto.body_type;
    if (dto.ext_color !== undefined) data.extColor = dto.ext_color;
    if (dto.engine !== undefined) data.engine = dto.engine;
    if (dto.miles !== undefined) data.miles = dto.miles;
    if (dto.status !== undefined) data.status = dto.status;

    await this.prisma.vehicle.update({
      where: { id },
      data,
    });

    return this.findOne(id);
  }

  // -------------------------
  // Remove (soft-delete)
  // -------------------------
  async remove(id: number) {
    const existing = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Vehicle not found');
    }

    await this.prisma.vehicle.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { status: 'ok', message: 'Vehicle soft-deleted', id };
  }
}