import { ApiProperty } from '@nestjs/swagger';
import { CreateOwnerAdminDto } from 'src/admin/admin.dto';

export class ClientDto {
  @ApiProperty({
    description: 'Unique identifier for the client',
    example: 'c1234567-89ab-cdef-0123-456789abcdef',
    required: true,
  })
  id: string;

  @ApiProperty({
    description: 'Name of the client',
    example: 'Client A',
    required: true,
  })
  name: string;

  @ApiProperty({
    description: 'Client Address',
    example: 'Client address in the client format.',
    required: false,
  })
  address?: string;

  @ApiProperty({
    description: 'Client Phone Number',
    example: '+1-234-567-8900',
    required: false,
  })
  phone?: string;

  @ApiProperty({
    description: 'Timestamp when the client was created',
    example: '2023-10-01T12:34:56.789Z',
    required: true,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the client was last updated',
    example: '2023-10-15T08:21:45.123Z',
    required: true,
  })
  updatedAt: Date;
}

export class InputResponseClientDto extends ClientDto {
  @ApiProperty({
    description: 'Client ownerId account',
    example: 'user1234567890abcdef',
    required: true,
  })
  ownerId?: string;
}

export class InputClientDto {
  @ApiProperty({
    description: 'Name of the client',
    example: 'Client A',
    required: true,
  })
  name: string;

  @ApiProperty({
    description: 'Client cnpj',
    example: 'Client document register number',
    required: false,
  })
  cnpj?: string;

  @ApiProperty({
    description: 'Client Address',
    example: 'Client address in the client format.',
    required: false,
  })
  address?: string;

  @ApiProperty({
    description: 'Client Phone Number',
    example: '+1-234-567-8900',
    required: false,
  })
  phone?: string;

  @ApiProperty({
    description: 'Client ownerId account',
    example: 'user1234567890abcdef',
    required: true,
  })
  ownerId?: string;
}

export class CreateClientWithAdminDto extends InputClientDto {
  admin: Omit<CreateOwnerAdminDto, 'clientId'>;
}
