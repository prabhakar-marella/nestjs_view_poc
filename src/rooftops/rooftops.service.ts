import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class RooftopsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.rooftop.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        street: true,
        city: true,
        state: true,
        zip: true,
        phone: true,
        email: true,
        site: true,
      },
    });
  }

  async findOne(id: number) {
    const r = await this.prisma.rooftop.findUnique({
      where: { id },
      include: {
        vehicles: {
          select: { id: true, make: true, model: true, year: true, vehListingType: true, trim: true, bodyType: true },
          orderBy: { id: "asc" },
        },
      },
    });
    if (!r) return null;

    return {
      id: r.id,
      name: r.name,
      street: r.street,
      city: r.city,
      state: r.state,
      zip: r.zip,
      phone: r.phone,
      email: r.email,
      site: r.site,
      vehicles: r.vehicles.map((v) => ({
        id: v.id,
        make: v.make,
        model: v.model,
        year: v.year,
        veh_listing_type: v.vehListingType ? String(v.vehListingType) : null,
        trim: v.trim,
        body_type: v.bodyType,
      })),
    };
  }
}
