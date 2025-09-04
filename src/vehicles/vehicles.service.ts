import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { $Enums } from "@prisma/client";

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
      orderBy: { id: "asc" },
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
    if (!r) return null;

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
      rooftop: r.rooftop ? {
        id: r.rooftop.id,
        name: r.rooftop.name,
        city: r.rooftop.city,
        state: r.rooftop.state,
      } : null,
    };
  }
}
