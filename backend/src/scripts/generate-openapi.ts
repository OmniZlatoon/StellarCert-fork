import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../app.module';
import * as fs from 'fs';
import * as path from 'path';

async function generateOpenApi() {
  console.log('Starting OpenAPI generation...');

  const app = await NestFactory.create(AppModule, { logger: false });

  const config = new DocumentBuilder()
    .setTitle('StellarCert API')
    .setDescription('Certificate Management System API Documentation')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  fs.writeFileSync(
    path.join(__dirname, '../../openapi.json'),
    JSON.stringify(document, null, 2),
  );
  console.log('Document written to openapi.json');

  await app.close();
  console.log('Generation completed.');
}

generateOpenApi().catch((err) => {
  console.error(err);
  process.exit(1);
});
