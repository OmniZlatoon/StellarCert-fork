import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BullBoardAuthMiddleware } from './bull-board-auth.middleware';
import { Request, Response, NextFunction } from 'express';

describe('BullBoardAuthMiddleware', () => {
  let middleware: BullBoardAuthMiddleware;
  let configService: jest.Mocked<ConfigService>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BullBoardAuthMiddleware,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    middleware = module.get<BullBoardAuthMiddleware>(BullBoardAuthMiddleware);
    configService = module.get(ConfigService);

    mockRes = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  it('should return 404 if BULL_BOARD_ENABLED is false', () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'BULL_BOARD_ENABLED') return 'false';
      return undefined;
    });

    mockReq = { headers: {} };

    middleware.use(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.send).toHaveBeenCalledWith('Not Found');
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 403 in production if no password is configured', () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'NODE_ENV') return 'production';
      return undefined;
    });

    mockReq = { headers: {} };

    middleware.use(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 if no authorization header is present', () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'NODE_ENV') return 'development';
      if (key === 'BULL_BOARD_PASSWORD') return 'secret';
      return undefined;
    });

    mockReq = { headers: {} };

    middleware.use(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'WWW-Authenticate',
      'Basic realm="Bull Board"',
    );
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next() if valid basic auth credentials are provided', () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'BULL_BOARD_USER') return 'admin';
      if (key === 'BULL_BOARD_PASSWORD') return 'secret123';
      return undefined;
    });

    const credentials = Buffer.from('admin:secret123').toString('base64');
    mockReq = {
      headers: {
        authorization: `Basic ${credentials}`,
      },
    };

    middleware.use(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should return 401 if invalid credentials are provided', () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'BULL_BOARD_USER') return 'admin';
      if (key === 'BULL_BOARD_PASSWORD') return 'secret123';
      return undefined;
    });

    const credentials = Buffer.from('admin:wrongpassword').toString('base64');
    mockReq = {
      headers: {
        authorization: `Basic ${credentials}`,
      },
    };

    middleware.use(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });
});
