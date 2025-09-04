import { Controller, Get, Param, ParseIntPipe, NotFoundException } from "@nestjs/common";
import { VehiclesService } from "./vehicles.service";

@Controller("api/vehicles")
export class VehiclesApiController {
  constructor(private svc: VehiclesService) {}

  @Get()
  async list() {
    return this.svc.findAll();
  }

  @Get(":id")
  async getOne(@Param("id", ParseIntPipe) id: number) {
    const v = await this.svc.findOne(id);
    if (!v) throw new NotFoundException("Vehicle not found");
    return v;
  }
}