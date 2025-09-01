import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  let viewsPath = join(__dirname, '..', 'src', 'views');
  app.setBaseViewsDir(viewsPath);
  app.setViewEngine('ejs');
  app.useStaticAssets(join(__dirname, '..', 'public'));

  app.set('trust proxy', 1);
  app.enableCors({ origin: true, credentials: true });

  //app.setGlobalPrefix('api');

  const prismaService = app.get(PrismaService);
  if (prismaService && typeof prismaService['enableShutdownHooks'] === 'function') {    
    await prismaService['enableShutdownHooks'](app);
  }

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
}
bootstrap();
