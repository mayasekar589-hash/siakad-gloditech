import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix("api/v1");
  app.use(helmet());
  app.enableCors({
    origin: [
      config.get<string>("WEBSITE_ORIGIN", "http://localhost:3002"),
      config.get<string>("STUDENT_ORIGIN", "http://localhost:3000"),
      config.get<string>("BACKOFFICE_ORIGIN", "http://localhost:3001")
    ],
    credentials: true
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));

  const swaggerConfig = new DocumentBuilder()
    .setTitle("SIAKAD API")
    .setDescription("Central API for the SIAKAD portals.")
    .setVersion("1.0")
    .build();
  SwaggerModule.setup("api/v1/docs", app, SwaggerModule.createDocument(app, swaggerConfig));

  const port = Number(config.get<string>("PORT", "4000"));
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be a valid TCP port.");
  }

  await app.listen(port, "0.0.0.0");
}

void bootstrap();