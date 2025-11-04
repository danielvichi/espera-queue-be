import { ApiProperty, OmitType } from '@nestjs/swagger';
import { QueueDto } from 'src/queue/queue.dto';

export class QueueInstanceDto extends OmitType(QueueDto, ['id']) {
  @ApiProperty({
    description: 'Unique identifier for Queue Reference',
    example: 'c1234567-89ab-cdef-0123-456789abcdef',
    required: true,
  })
  queueId: string;

  @ApiProperty({
    description: 'Unique identifier for Queue Instance',
    example: 'c1234567-89ab-cdef-0123-456789abcdef',
    required: true,
  })
  queueInstanceId: string;

  @ApiProperty({
    description: "List of User's IDs of in this queue",
    example: 'c1234567-89ab-cdef-0123-456789abcdef',
    required: true,
  })
  usersInQueue: string[];

  @ApiProperty({
    description: "List of User's IDs of in this queue",
    example: 'c1234567-89ab-cdef-0123-456789abcdef',
    required: true,
  })
  attendedUsers: string[];
}

export class AddUserToQueueInstanceDto {
  @ApiProperty({
    description: 'Unique identifier for Queue Reference',
    example: 'c1234567-89ab-cdef-0123-456789abcdef',
    required: true,
  })
  queueId: string;

  @ApiProperty({
    description: 'Unique identifier for Queue Instance',
    example: 'c1234567-89ab-cdef-0123-456789abcdef',
    required: false,
  })
  queueInstanceId?: string;
}
