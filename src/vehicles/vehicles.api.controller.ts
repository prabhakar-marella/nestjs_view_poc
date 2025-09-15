import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Controller('api/vehicles')
export class VehiclesApiController {
  constructor(private readonly svc: VehiclesService) {}

  @Get()
  async list() {
    return this.svc.findAll();
  }

  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    const v = await this.svc.findOne(id);
    if (!v) throw new NotFoundException('Vehicle not found');
    return v;
  }

  @Post()
  async create(@Body() dto: CreateVehicleDto) {
    const created = await this.svc.create(dto);
    return {
      status: 'ok',
      data: created,
    };
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVehicleDto) {
    const updated = await this.svc.update(id, dto);
    return {
      status: 'ok',
      data: updated,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}