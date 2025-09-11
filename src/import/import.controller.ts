import { Controller, Get, Query, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ImportService } from './import.service';

@Controller('api/import')
export class ImportController {
  private readonly logger = new Logger(ImportController.name);

  constructor(private readonly importService: ImportService) {}

  @Get('run')
  async run(@Query('file') file?: string, @Query('dryRun') dryRunQuery?: string) {
    const filename = file && file.trim() ? file.trim() : 'CB191653.txt';
    const dryRun = (String(dryRunQuery || '').toLowerCase() === 'true');

    this.logger.log(`Import requested for file: ${filename} (dryRun=${dryRun})`);

    try {
      const result = await this.importService.importFile(filename, { dryRun });
      this.logger.log(`Import finished: ${JSON.stringify(result)}`);
      return result;
    } catch (err) {
      this.logger.error('Import failed', (err as Error).stack ?? err);
      throw new HttpException(
        { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Import failed', error: String(err) },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
