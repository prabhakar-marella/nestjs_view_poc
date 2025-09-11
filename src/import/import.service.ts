import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';
import { parse } from 'csv-parse';

type RawRow = { [k: string]: string };
type ImportOptions = { dryRun?: boolean };

const BATCH_SIZE = 10;
const UPLOADS_DIR = process.cwd() + '/uploads';

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async importFile(filename: string, opts: ImportOptions = { dryRun: false }) {
    const filePath = join(UPLOADS_DIR, filename);
    this.logger.log(`Starting import for file: ${filePath} (dryRun=${opts.dryRun})`);

    if (!existsSync(filePath)) {
      const msg = `CSV file not found: ${filePath}`;
      this.logger.error(msg);
      throw new Error(msg);
    }

    const parser = createReadStream(filePath).pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true,
      }),
    );

    let buffer: any[] = [];
    let rowNum = 0;
    let totalParsed = 0;
    let totalWouldCreate = 0;
    let totalWouldUpdate = 0;
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalErrors = 0;

    for await (const record of parser) {
      rowNum++;
      this.logger.log(`Parsed row ${rowNum}`);
      const mapped = this.mapRow(record as RawRow);
      const errors = this.validateMapped(mapped);
      if (errors.length > 0) {
        totalErrors++;
        this.logger.warn(`Row ${rowNum} validation errors: ${errors.join('; ')}`);
        continue;
      }

      buffer.push(mapped);
      totalParsed++;

      if (buffer.length >= BATCH_SIZE) {
        const res = await this.processBatch(buffer, opts);
        if (opts.dryRun) {
          totalWouldCreate += res.wouldCreate ?? 0;
          totalWouldUpdate += res.wouldUpdate ?? 0;
        } else {
          totalCreated += res.created ?? 0;
          totalUpdated += res.updated ?? 0;
        }
        buffer = [];
      }
    }

    if (buffer.length) {
      const res = await this.processBatch(buffer, opts);
      if (opts.dryRun) {
        totalWouldCreate += res.wouldCreate ?? 0;
        totalWouldUpdate += res.wouldUpdate ?? 0;
      } else {
        totalCreated += res.created ?? 0;
        totalUpdated += res.updated ?? 0;
      }
    }

    this.logger.log('Import complete.');
    this.logger.log(`  totalParsed: ${totalParsed}`);
    if (opts.dryRun) {
      this.logger.log(`  totalWouldCreate: ${totalWouldCreate}`);
      this.logger.log(`  totalWouldUpdate: ${totalWouldUpdate}`);
    } else {
      this.logger.log(`  totalCreated: ${totalCreated}`);
      this.logger.log(`  totalUpdated: ${totalUpdated}`);
    }
    this.logger.log(`  totalErrors: ${totalErrors}`);

    // disconnect Prisma only when not dryRun? We can always disconnect.
    await this.prisma.$disconnect();

    return {
      file: filename,
      totalParsed,
      totalErrors,
      ...(opts.dryRun
        ? { totalWouldCreate: totalWouldCreate, totalWouldUpdate: totalWouldUpdate, dryRun: true }
        : { totalCreated, totalUpdated, dryRun: false }),
    };
  }

  // --- helpers (mapRow, validateMapped) ---
  private truncate(s?: string | null, max = 65000) {
  if (!s) return null;
  if (s.length <= max) return s;

  this.logger.warn(`Truncating field (length ${s.length}) to ${max} chars`);
  return s.slice(0, max);
}

  private toInt(s?: string): number | undefined {
    if (!s) return undefined;
    const n = parseInt(s.replace(/[^0-9-]/g, ''), 10);
    return Number.isNaN(n) ? undefined : n;
  }

  private toFloat(s?: string): number | undefined {
    if (!s) return undefined;
    const n = parseFloat(s.replace(/[^0-9.\-]/g, ''));
    return Number.isNaN(n) ? undefined : n;
  }

  private parseDate(s?: string): Date | undefined {
    if (!s || s.trim() === '') return undefined;
    const m = s.trim();
    const parts = m.split(' ');
    const datePart = parts[0];
    const dArr = datePart.split('/');
    if (dArr.length === 3) {
      let [mm, dd, yy] = dArr;
      if (yy.length === 2) yy = '20' + yy;
      const iso = `${yy.padStart(4, '0')}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}T00:00:00Z`;
      const dt = new Date(iso);
      if (!isNaN(dt.getTime())) return dt;
    }
    const dt = new Date(m);
    return isNaN(dt.getTime()) ? undefined : dt;
  }

  private mapRow(r: RawRow) {
    const obj: any = {
      dealerId: r['DealerId'] || r['Dealer ID'] || null,
      dealerName: r['Dealer Name'] || null,
      vin: (r['VIN'] || '').trim(),
      stockNo: r['Stock #'] || null,
      newUsed: (r['New/Used'] || '').trim() || null,
      year: this.toInt(r['Year']),
      make: r['Make'] || null,
      model: r['Model'] || null,
      modelNumber: r['Model Number'] || null,
      body: r['Body'] || null,
      transmission: r['Transmission'] || null,
      series: r['Series'] || null,
      bodyDoorCt: this.toInt(r['Body Door Ct']),
      odometer: this.toInt(r['Odometer']),
      engineCylinderCt: this.toInt(r['Engine Cylinder Ct']),
      engineDisplacement: r['Engine Displacement'] || null,
      drivetrainDesc: r['Drivetrain Desc'] || null,
      colour: r['Colour'] || null,
      interiorColor: r['Interior Color'] || null,
      msrp: this.toFloat(r['MSRP']),
      price: this.toFloat(r['Price']),
      inventoryDate: this.parseDate(r['Inventory Date']),
      certified: (r['Certified'] || '').trim().toLowerCase() === 'yes' || false,
      description: this.truncate(r['Description'] || null, 65000),
      features: this.truncate(r['Features'] || null, 65000),
      photoUrlList: this.truncate((r['Photo Url List'] || r['Photo Urls'] || '').trim() || null, 65000),
      cityMpg: this.toInt(r['City MPG']),
      highwayMpg: this.toInt(r['Highway MPG']),
      photosLastModified: this.parseDate(r['Photos Last Modified Date']),
      seriesDetail: r['Series Detail'] || null,
      engine: r['Engine'] || null,
      fuel: r['Fuel'] || null,
      age: this.toInt(r['Age']),
      tags: this.truncate(r['Tags'] || null, 65000),
    };

    Object.keys(obj).forEach((k) => {
      if (typeof obj[k] === 'string') {
        obj[k] = obj[k].length ? obj[k] : null;
      }
    });

    return obj;
  }

  private validateMapped(obj: any) {
    const errors: string[] = [];
    if (!obj.vin || obj.vin.length < 11) {
      errors.push('VIN missing or too short');
    }
    if (obj.year && (obj.year < 1900 || obj.year > new Date().getFullYear() + 1)) {
      errors.push('Year out of range');
    }
    if (obj.price !== undefined && obj.price < 0) errors.push('Price negative');
    if (obj.msrp !== undefined && obj.msrp < 0) errors.push('MSRP negative');
    return errors;
  }

  // ---------------- Batch processing (supports dryRun) ----------------
  private async processBatch(batch: any[], opts: ImportOptions = { dryRun: false }) {
    if (!batch.length) return opts.dryRun ? { wouldCreate: 0, wouldUpdate: 0 } : { created: 0, updated: 0 };

    this.logger.log(`Processing batch of ${batch.length} rows...`);
    const vins = batch.map((r) => r.vin).filter(Boolean);

    const existing = await this.prisma.vehiclesCsvImport.findMany({
      where: { vin: { in: vins } },
      select: { id: true, vin: true },
    });
    const existingMap = new Map(existing.map((e) => [e.vin, e.id]));

    const toCreate = [];
    const toUpdate = [];

    for (const r of batch) {
      if (!r.vin) continue;
      if (existingMap.has(r.vin)) {
        toUpdate.push({ id: existingMap.get(r.vin), data: r });
      } else {
        toCreate.push(r);
      }
    }

    if (opts.dryRun) {
      return { wouldCreate: toCreate.length, wouldUpdate: toUpdate.length };
    }

    let created = 0;
    let updated = 0;

    if (toCreate.length) {
      const rows = toCreate.map((r) => ({
          dealerId: r.dealerId,
          dealerName: r.dealerName,
          vin: r.vin,
          stockNo: r.stockNo,
          newUsed: r.newUsed,
          year: r.year,
          make: r.make,
          model: r.model,
          modelNumber: r.modelNumber,
          body: r.body,
          transmission: r.transmission,
          series: r.series,
          bodyDoorCt: r.bodyDoorCt,
          odometer: r.odometer,
          engineCylinderCt: r.engineCylinderCt,
          engineDisplacement: r.engineDisplacement,
          drivetrainDesc: r.drivetrainDesc,
          colour: r.colour,
          interiorColor: r.interiorColor,
          msrp: r.msrp,
          price: r.price,
          inventoryDate: r.inventoryDate,
          certified: r.certified,
          description: r.description,
          features: r.features,
          photoUrlList: r.photoUrlList,
          cityMpg: r.cityMpg,
          highwayMpg: r.highwayMpg,
          photosLastModified: r.photosLastModified,
          seriesDetail: r.seriesDetail,
          engine: r.engine,
          fuel: r.fuel,
          age: r.age,
          tags: r.tags,
      }));

      try {
        const res = await this.prisma.vehiclesCsvImport.createMany({
          data: rows,
          skipDuplicates: true,
        } as any);

        created += (res && (res as any).count) || rows.length;
        this.logger.log(`Inserted ${rows.length} rows (createMany).`);
      } catch (err) {
        this.logger.error('createMany failed, falling back to individual creates', err);
        for (const r of rows) {
          try {
            await this.prisma.vehiclesCsvImport.create({ data: r });
            created++;
          } catch (e) {
            this.logger.error('create single failed', e);
          }
        }
      }
    }

if (toUpdate.length) {
  try {    
    const updatedRows: any[] = [];
    for (const u of toUpdate) {
      try {
        const updated = await this.prisma.vehiclesCsvImport.update({
          where: { id: u.id },
          data: {
            dealerId: u.data.dealerId,
            dealerName: u.data.dealerName,
            stockNo: u.data.stockNo,
            newUsed: u.data.newUsed,
            year: u.data.year,
            make: u.data.make,
            model: u.data.model,
            modelNumber: u.data.modelNumber,
            body: u.data.body,
            transmission: u.data.transmission,
            series: u.data.series,
            bodyDoorCt: u.data.bodyDoorCt,
            odometer: u.data.odometer,
            engineCylinderCt: u.data.engineCylinderCt,
            engineDisplacement: u.data.engineDisplacement,
            drivetrainDesc: u.data.drivetrainDesc,
            colour: u.data.colour,
            interiorColor: u.data.interiorColor,
            msrp: u.data.msrp,
            price: u.data.price,
            inventoryDate: u.data.inventoryDate,
            certified: u.data.certified,
            description: u.data.description,
            features: u.data.features,
            photoUrlList: u.data.photoUrlList,
            cityMpg: u.data.cityMpg,
            highwayMpg: u.data.highwayMpg,
            photosLastModified: u.data.photosLastModified,
            seriesDetail: u.data.seriesDetail,
            engine: u.data.engine,
            fuel: u.data.fuel,
            age: u.data.age,
            tags: u.data.tags,
          },
        });
        updatedRows.push(updated);
      } catch (e) {
        this.logger.error(`Update failed for id=${u.id} vin=${u.data.vin} error=${(e as any).message}`);
        if ((e as any).meta) this.logger.error(`Prisma meta: ${(e as any).meta.column_name}`);
        // continue to next row
      }
    }

    updated += updatedRows.length;    
    this.logger.log(`Updated ${updatedRows.length} rows. Sample updated rows:`);
    this.logger.log(updatedRows.slice(0, 5).map(r => ({ id: r.id, vin: r.vin, dealerName: r.dealerName })));
  } catch (err) {
    this.logger.error('Batch updates section fatal error', err);
  }
}
    return { created, updated };
  }
}