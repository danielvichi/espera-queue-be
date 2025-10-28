import { ApiProperty } from '@nestjs/swagger';

export class QueueUserDto {
  @ApiProperty({
    description: 'Unique identifier for User Queue',
    example: 'c1234567-89ab-cdef-0123-456789abcdef',
    required: true,
  })
  id: string;

  @ApiProperty({
    description: 'Name of the User Queue',
    example: 'John Doe',
    required: false,
  })
  name: string;

  @ApiProperty({
    description: 'Email of the User Queue',
    example: 'john_doe@email.com',
    required: false,
  })
  email: string;

  @ApiProperty({
    description: 'Timestamp when the User Queue was created',
    example: '2023-10-01T12:34:56.789Z',
    required: true,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the User Queue was last updated',
    example: '2023-10-15T08:21:45.123Z',
    required: true,
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Indicates if the User Queue is deactivated',
    example: true,
    required: true,
  })
  enabled: boolean;
}

export class CreateQueueUserDto {
  @ApiProperty({
    description: 'Name of the User Queue',
    example: 'John Doe',
    required: false,
  })
  name: string;

  @ApiProperty({
    description: 'Email of the User Queue',
    example: 'john_doe@email.com',
    required: false,
  })
  email: string;

  @ApiProperty({
    description: 'Hashed password of the User Queue',
    example: '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
    required: true,
  })
  passwordHash: string;
}
