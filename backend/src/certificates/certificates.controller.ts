import { Controller, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { SearchCertificatesQueryDto } from './dto/search-certificates.dto';

@ApiTags('certificates')
@Controller('api/v1/certificates')
export class CertificatesController {
  @Get('search')
  @ApiOperation({ summary: 'Search certificates by query terms and filters' })
  @ApiResponse({ status: 200, description: 'Certificates matching search criteria retrieved successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation error details included.' })
  async search(@Query() queryDto: SearchCertificatesQueryDto) {
    return this.certificatesService.search(queryDto);
  }
}