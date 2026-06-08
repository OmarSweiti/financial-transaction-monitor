import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable Cross-Origin Resource Sharing (CORS) so the Next.js frontend can connect
  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // Strip properties not in the DTO
      forbidNonWhitelisted: true, // Reject requests with unknown properties (400)
      transform: true,            // Enable @Type() coercion (e.g. query strings → numbers)
      transformOptions: {
        enableImplicitConversion: false, // Require explicit @Type() — no magic coercion
      },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
