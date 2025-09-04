import { Controller, Get, Param, ParseIntPipe, NotFoundException } from "@nestjs/common";
import { RooftopsService } from "./rooftops.service";

@Controller("api/rooftops")
export class RooftopsController {
  constructor(private svc: RooftopsService) {}

  @Get()
  async list() {
    return this.svc.findAll();
  }

  @Get(":id")
  async getOne(@Param("id", ParseIntPipe) id: number) {
    const r = await this.svc.findOne(id);
    if (!r) throw new NotFoundException("Rooftop not found");
    return r;
  }
}
