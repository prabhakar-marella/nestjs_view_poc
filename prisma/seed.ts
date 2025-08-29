import { PrismaClient} from '@prisma/client';
import { $Enums } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // delete everything first
  await prisma.vehicle.deleteMany();

  // now insert fresh 20
  await prisma.vehicle.createMany({
    data : [
  { make: 'Toyota1',        model: 'Camry',     year: 2021, veh_listing_type: $Enums.VehListingType.Used },
  { make: 'Honda',         model: 'Civic',     year: 2022, veh_listing_type: $Enums.VehListingType.New },
  { make: 'Ford',          model: 'F-150',     year: 2023, veh_listing_type: $Enums.VehListingType.New },
  { make: 'Chevrolet',     model: 'Malibu',    year: 2020, veh_listing_type: $Enums.VehListingType.Used },
  { make: 'BMW',           model: '3 Series',  year: 2021, veh_listing_type: $Enums.VehListingType.Used },
  { make: 'Mercedes-Benz', model: 'C-Class',   year: 2022, veh_listing_type: $Enums.VehListingType.New },
  { make: 'Tesla',         model: 'Model 3',   year: 2023, veh_listing_type: $Enums.VehListingType.New },
  { make: 'Hyundai',       model: 'Elantra',   year: 2021, veh_listing_type: $Enums.VehListingType.Used },
  { make: 'Kia',           model: 'Sorento',   year: 2022, veh_listing_type: $Enums.VehListingType.New },
  { make: 'Nissan',        model: 'Altima',    year: 2020, veh_listing_type: $Enums.VehListingType.Used },
  { make: 'Volkswagen',    model: 'Passat',    year: 2021, veh_listing_type: $Enums.VehListingType.Used },
  { make: 'Subaru',        model: 'Outback',   year: 2023, veh_listing_type: $Enums.VehListingType.New },
  { make: 'Mazda',         model: 'CX-5',      year: 2022, veh_listing_type: $Enums.VehListingType.New },
  { make: 'Audi',          model: 'A4',        year: 2021, veh_listing_type: $Enums.VehListingType.Used },
  { make: 'Jeep',          model: 'Wrangler',  year: 2023, veh_listing_type: $Enums.VehListingType.New },
  { make: 'Lexus',         model: 'RX 350',    year: 2022, veh_listing_type: $Enums.VehListingType.New },
  { make: 'Volvo',         model: 'XC60',      year: 2021, veh_listing_type: $Enums.VehListingType.Used },
  { make: 'Chevrolet',     model: 'Tahoe',     year: 2023, veh_listing_type: $Enums.VehListingType.New },
  { make: 'GMC',           model: 'Sierra',    year: 2022, veh_listing_type: $Enums.VehListingType.Used },
  { make: 'Porsche',       model: 'Macan',     year: 2021, veh_listing_type: $Enums.VehListingType.New },
]
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
  });
