import { ApiProperty } from '@nestjs/swagger';
import { QueueType } from '@prisma/client';

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
  name?: string | null;

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
  minWaitingTimeInMinutes?: number | null;

  @ApiProperty({
    description: 'Average maximum waiting time in minutes',
    example: '30',
    required: true,
  })
  maxWaitingTimeInMinutes?: number | null;

  @ApiProperty({
    description: 'Last user waiting time in minutes',
    example: '15',
    required: false,
  })
  currentWaitingTimeInMinutes?: number | null;

  @ApiProperty({
    description: 'Is queue already operating',
    example: 'true',
    required: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Timestamp when the queue starts operating',
    example: '19:00',
    required: false,
  })
  startQueueAt?: string | null;

  @ApiProperty({
    description: 'Timestamp when the queue starts operating',
    example: '23:00',
    required: false,
  })
  endQueueAt?: string | null;

  @ApiProperty({
    description: 'Max number of users allowed in the queue',
    example: '15',
    required: false,
  })
  maxUsersInQueue?: number | null;

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
  adminId?: string | null;
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
    description: 'Timestamp when the queue starts operating',
    example: '19:00',
    required: false,
  })
  startQueueAt?: string;

  @ApiProperty({
    description: 'Timestamp when the queue starts operating',
    example: '23:00',
    required: false,
  })
  endQueueAt?: string;

  @ApiProperty({
    description: 'Max number of users allowed in the queue',
    example: '15',
    required: false,
  })
  maxUsersInQueue?: number;

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
