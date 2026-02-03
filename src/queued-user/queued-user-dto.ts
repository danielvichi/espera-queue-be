import { ApiProperty } from '@nestjs/swagger';
import { QueuedUserStatus } from '@prisma/client';

export class QueuedUserDto {
  @ApiProperty({
    description: 'Unique identifier for the queued user entry',
    example: 'd1234567-89ab-cdef-0123-456789abcdef',
    required: true,
  })
  id: string;

  @ApiProperty({
    description: 'Identifier of the queue',
    example: 'c1234567-89ab-cdef-0123-456789abcdef',
    required: true,
  })
  queueId: string;

  @ApiProperty({
    description: 'Identifier of the user',
    example: 'u1234567-89ab-cdef-0123-456789abcdef',
    required: true,
  })
  userId: string;

  @ApiProperty({
    description: 'Status of the queued user',
    example: 'WAITING',
    required: true,
    enum: QueuedUserStatus,
  })
  status: QueuedUserStatus;

  @ApiProperty({
    description: 'Number of seats requested by the user',
    example: 2,
    required: true,
  })
  numberOfSeats: number;

  @ApiProperty({
    description: 'Timestamp when the queued user entry was created',
    example: '2023-10-01T12:34:56.789Z',
    required: true,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the queued user entry was last updated',
    example: '2023-10-01T12:34:56.789Z',
    required: true,
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Timestamp when the user was served',
    example: '2023-10-01T12:34:56.789Z',
    required: false,
  })
  servedAt?: Date;
}
