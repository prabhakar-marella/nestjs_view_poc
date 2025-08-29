import { Controller, Get } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { VehicleDto } from '../dto/vehicle.dto';

@Controller('api/vehicles')
export class VehiclesController {
  constructor(private readonly svc: VehiclesService) {}

  @Get()
  async findAll(): Promise<VehicleDto[]> {
    // This will directly return DTOs (with enum as type-safe values)
    return this.svc.findAll();
  }
}
