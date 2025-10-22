import { ApiProperty } from '@nestjs/swagger';
import { QueueType, UserQueued } from '@prisma/client';

export class QueueDto {
  @ApiProperty({
    description: 'Unique identifier for Queue',
    example: 'c1234567-89ab-cdef-0123-456789abcdef',
    required: true,
  })
  id: string;

  @ApiProperty({
    description: 'Name of the Queue',
    example: 'Unity A',
    required: false,
  })
  name?: string;

  @ApiProperty({
    description: 'Queue type',
    example: 'APPOINTMENT',
    required: true,
    enum: QueueType,
  })
  type: QueueType;

  @ApiProperty({
    description: 'Average minimum waiting time in minutes',
    example: '10',
    required: false,
  })
  minWaitingTimeInMinutes?: number;

  @ApiProperty({
    description: 'Average maximum waiting time in minutes',
    example: '30',
    required: true,
  })
  maxWaitingTimeInMinutes?: number;

  @ApiProperty({
    description: 'Last user waiting time in minutes',
    example: '15',
    required: false,
  })
  currentWaitingTimeInMinutes?: number;

  @ApiProperty({
    description: 'Is queue already operating',
    example: 'true',
    required: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Timestamp when the queue was created',
    example: '2023-10-01T12:34:56.789Z',
    required: true,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the queue was last updated',
    example: '2023-10-15T08:21:45.123Z',
    required: true,
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Indicates if the queue is deactivated',
    example: true,
    required: true,
  })
  enabled: boolean;

  @ApiProperty({
    description: 'ID of the Client associated with the queue',
    example: 'c1234567-89ab-cdef-0123-456789abcdef',
    required: true,
  })
  clientId: string;

  @ApiProperty({
    description: 'ID of the Unity associated with the queue',
    example: 'c1234567-89ab-cdef-0123-456789abcdef',
    required: true,
  })
  unityId: string;

  @ApiProperty({
    description: 'ID of the exclusive Admin associated with the queue',
    example: 'c1234567-89ab-cdef-0123-456789abcdef',
    required: false,
    nullable: true,
  })
  adminId?: string;

  @ApiProperty({
    description: "List of User's IDs of in this queue",
    example: 'c1234567-89ab-cdef-0123-456789abcdef',
    required: true,
  })
  UserQueue: UserQueued[];
}

export class CreateQueueDto {
  @ApiProperty({
    description: 'Name of the Queue',
    example: 'Unity A',
    required: false,
  })
  name?: string;

  @ApiProperty({
    description: 'Queue type',
    example: 'APPOINTMENT',
    required: true,
    enum: QueueType,
  })
  type: QueueType;

  @ApiProperty({
    description: 'ID of the Client associated with the queue',
    example: 'c1234567-89ab-cdef-0123-456789abcdef',
    required: true,
  })
  clientId: string;

  @ApiProperty({
    description: 'ID of the Unity associated with the queue',
    example: 'c1234567-89ab-cdef-0123-456789abcdef',
    required: true,
  })
  unityId: string;

  @ApiProperty({
    description: 'ID of the exclusive Admin associated with the queue',
    example: 'c1234567-89ab-cdef-0123-456789abcdef',
    required: false,
    nullable: true,
  })
  adminId?: string;
}
