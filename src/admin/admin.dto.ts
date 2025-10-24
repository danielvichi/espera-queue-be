import { ApiProperty, OmitType } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { ClientDto } from 'src/client/client.dto';

export class AdminDto {
  @ApiProperty({
    description: 'Unique identifier for the admin',
    example: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
    required: true,
  })
  id: string;

  @ApiProperty({
    description: 'Role of the admin',
    example: 'CLIENT_OWNER',
    required: true,
    enum: AdminRole,
  })
  role: AdminRole;

  @ApiProperty({
    description: 'Name of the admin',
    example: 'Admin User',
    required: true,
  })
  name: string;

  @ApiProperty({
    description: 'Email of the admin',
    example: 'admin@email.com',
    uniqueItems: true,
    required: true,
  })
  email: string;

  @ApiProperty({
    description: 'Hashed password of the admin',
    example: '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
    required: true,
  })
  passwordHash: string;

  @ApiProperty({
    description: 'Timestamp when the admin was created',
    example: '2023-10-01T12:34:56.789Z',
    required: true,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the admin was last updated',
    example: '2023-10-15T08:21:45.123Z',
    required: true,
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'ID of the client associated with the admin (if applicable)',
    example: 'c1234567-89ab-cdef-0123-456789abcdef',
    required: false,
    nullable: true,
  })
  clientId: string;

  @ApiProperty({
    description: 'List of Unity IDs associated with the admin (if applicable)',
    example: ['u1234567-89ab-cdef-0123-456789abcdef'],
    required: false,
    isArray: true,
    nullable: true,
  })
  unityIds?: string[];

  @ApiProperty({
    description: 'List of Queue IDs associated with the admin (if applicable)',
    example: ['q1234567-89ab-cdef-0123-456789abcdef'],
    required: false,
    isArray: true,
    nullable: true,
  })
  queueIds?: string[];

  @ApiProperty({
    description: 'Indicates if the admin account is enabled',
    example: true,
    required: true,
  })
  enabled: boolean;
}

export class AdminResponseDto extends OmitType(AdminDto, ['passwordHash']) {}
export class AdminWithClientDto extends AdminResponseDto {
  client: ClientDto;
}

export class CreatedAdminDto {
  @ApiProperty({
    description: 'Role of the admin',
    example: 'CLIENT_OWNER',
    required: true,
    enum: AdminRole,
  })
  role: AdminRole;

  @ApiProperty({
    description: 'Name of the admin',
    example: 'Admin User',
    required: true,
  })
  name: string;

  @ApiProperty({
    description: 'Email of the admin',
    example: 'admin@email.com',
    uniqueItems: true,
    required: true,
  })
  email: string;

  @ApiProperty({
    description: 'Hashed password of the admin',
    example: '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
    required: true,
  })
  passwordHash: string;

  @ApiProperty({
    description: 'ID of the client associated with the admin (if applicable)',
    example: 'c1234567-89ab-cdef-0123-456789abcdef',
    required: false,
    nullable: true,
  })
  clientId: string;

  @ApiProperty({
    description: 'List of Unity IDs associated with the admin (if applicable)',
    example: ['u1234567-89ab-cdef-0123-456789abcdef'],
    required: false,
    isArray: true,
    nullable: true,
  })
  unityIds?: string[];

  @ApiProperty({
    description: 'List of Queue IDs associated with the admin (if applicable)',
    example: ['q1234567-89ab-cdef-0123-456789abcdef'],
    required: false,
    isArray: true,
    nullable: true,
  })
  queueIds?: string[];
}

export class CreateOwnerAdminDto {
  @ApiProperty({
    description: 'Name of the admin',
    example: 'Admin User',
    required: true,
  })
  name: string;

  @ApiProperty({
    description: 'Email of the admin',
    example: 'admin@email.com',
    uniqueItems: true,
    required: true,
  })
  email: string;

  @ApiProperty({
    description: 'Hashed password of the admin',
    example: '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
    required: true,
  })
  passwordHash: string;

  @ApiProperty({
    description: 'ID of the client associated with the admin (if applicable)',
    example: 'c1234567-89ab-cdef-0123-456789abcdef',
    required: false,
    nullable: true,
  })
  clientId: string;
}

export class SignInDto {
  @ApiProperty({
    description: 'Email of the admin',
    example: 'user@email.com',
    uniqueItems: true,
    required: true,
  })
  email: string;

  @ApiProperty({
    description: 'Hashed password of the admin',
    example: '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
    required: true,
  })
  passwordHash: string;
}
