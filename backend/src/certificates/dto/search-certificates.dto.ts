import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SearchCertificatesQueryDto {
  @ApiPropertyOptional({
    description: 'Free-text search query across certificate fields (e.g., recipient name, title, issuer)',
    example: 'Blockchain Certification',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  query?: string;

  @ApiPropertyOptional({
    description: 'Filter search by certificate status',
    example: 'active',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    default: 1,
  })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 10,
  })
  @IsOptional()
  limit?: number;
}