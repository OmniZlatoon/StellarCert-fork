import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class BullBoardAuthMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const isBullBoardDisabled =
      this.configService.get<string>('BULL_BOARD_ENABLED') === 'false' ||
      this.configService.get<boolean>('BULL_BOARD_ENABLED') === false;

    if (isBullBoardDisabled) {
      return res.status(404).send('Not Found');
    }

    const expectedUser =
      this.configService.get<string>('BULL_BOARD_USER') ||
      this.configService.get<string>('BULL_BOARD_USERNAME') ||
      'admin';

    const expectedPass =
      this.configService.get<string>('BULL_BOARD_PASSWORD') ||
      this.configService.get<string>('ADMIN_PASSWORD');

    const isProd =
      this.configService.get<string>('NODE_ENV') === 'production';

    // In production, require an explicit password or reject access
    if (isProd && !expectedPass) {
      return res
        .status(403)
        .send('Bull-Board queue dashboard is disabled or unconfigured in production');
    }

    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Bull Board"');
      return res.status(401).send('Authentication required');
    }

    try {
      const base64Credentials = authHeader.substring(6).trim();
      const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
      const colonIndex = credentials.indexOf(':');

      if (colonIndex === -1) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Bull Board"');
        return res.status(401).send('Invalid credentials');
      }

      const user = credentials.substring(0, colonIndex);
      const pass = credentials.substring(colonIndex + 1);

      if (
        user === expectedUser &&
        (!expectedPass || pass === expectedPass)
      ) {
        return next();
      }
    } catch {
      // Invalid format or decoding error
    }

    res.setHeader('WWW-Authenticate', 'Basic realm="Bull Board"');
    return res.status(401).send('Invalid credentials');
  }
}
