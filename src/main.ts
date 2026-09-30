import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

let app: NestExpressApplication;

async function bootstrap() {
  if (!app) {
    app = await NestFactory.create<NestExpressApplication>(AppModule);
    app.useWebSocketAdapter(new IoAdapter(app));
    app.enableCors({
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    });

    const swaggerConfig = new DocumentBuilder()
      .setTitle('Oron SeniorCare API')
      .setDescription('API documentation for Oron SeniorCare backend')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    await app.init(); // ← KEY CHANGE: init() not listen() for Vercel
  }
  return app;
}

// Local development only
if (process.env.NODE_ENV !== 'production') {
  bootstrap().then((app) => app.listen(process.env.PORT ?? 3000));
}

// Vercel serverless handler
export default async (req: any, res: any) => {
  const server = await bootstrap();
  server.getHttpAdapter().getInstance()(req, res);
};