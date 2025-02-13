import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ValidationPipe, Logger} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  
  const logger = new Logger('Bootstrap');
  app.useLogger(logger);
  
  const configService = app.get(ConfigService);

  // Global middlewares
  app.use(helmet());
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
  });

  // Global pipes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  try {
    await app.listen(configService.get('app.port'));
    console.log(`Application is running on: ${await app.getUrl()}`);
  } catch (error) {
    logger.error(`Failed to start application: ${error.message}`);
  }
}
bootstrap();