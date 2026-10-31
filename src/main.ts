// Точка входу: створює застосунок, вмикає документацію і починає слухати порт.
// Це єдиний файл, який запускає Node: node dist/main.js.
// Він завантажує app.module.ts, а далі все робить Nest.
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { Request, Response } from 'express';
import { AppModule } from './app.module';
import { setupApp } from './app.setup';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  setupApp(app);

  // OpenAPI-документ збирається з декораторів у контролерах і DTO.
  const config = new DocumentBuilder()
    .setTitle('Бібліотека')
    .setDescription('Навчальний бекенд: автори, книги, видачі')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  // GET /openapi.json: сам документ. Його читає Scalar і будь-який інший інструмент.
  app.getHttpAdapter().get('/openapi.json', (_req: Request, res: Response) => {
    res.json(document);
  });

  // GET /reference: сторінка з документацією, де можна одразу робити запити.
  app.use('/reference', apiReference({ url: '/openapi.json' }));

  // GET /scheme: схема проєкту (Excalidraw у режимі перегляду), файли з папки public.
  (app as NestExpressApplication).useStaticAssets(join(__dirname, '..', 'public'));
  app.getHttpAdapter().get('/scheme', (_req: Request, res: Response) => {
    res.sendFile(join(__dirname, '..', 'public', 'scheme.html'));
  });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`Застосунок слухає http://localhost:${port}, документація: /reference, схема: /scheme`);
}

bootstrap();
