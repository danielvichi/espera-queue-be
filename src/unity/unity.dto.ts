import { ApiProperty } from '@nestjs/swagger';

export class UnityDto {
  @ApiProperty({
    description: 'Unique identifier for the Unity',
    example: 'c1234567-89ab-cdef-0123-456789abcdef',
    required: true,
  })
  id: string;

  @ApiProperty({
    description: 'Name of the Unity',
    example: 'Unity A',
    required: true,
  })
  name: string;

  @ApiProperty({
    description: 'Unity Address',
    example: 'Unity address in the client format.',
    required: false,
  })
  address?: string;

  @ApiProperty({
    description: 'Unity Phone Number',
    example: '+1-234-567-8900',
    required: false,
  })
  phone?: string;

  @ApiProperty({
    description: 'Unity email',
    example: 'unity@email.com',
    required: false,
  })
  email?: string;

  @ApiProperty({
    description: 'Timestamp when the Unity was created',
    example: '2023-10-01T12:34:56.789Z',
    required: true,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the Unity was last updated',
    example: '2023-10-15T08:21:45.123Z',
    required: true,
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Id of the Client this Unity belongs to',
    example: 'c1234567-89ab-cdef-0123-456789abcdef',
  })
  clientId: string;

  @ApiProperty({
    description: 'Status of the unity',
    example: 'true',
  })
  enabled: boolean;

  // @ApiProperty({
  //   description: 'List of Queue from this Unity',
  //   example: '[c1234567, 456789abcdef, cdefcd1ef]',
  //   required: true,
  // })
  // queueIds: string[];

  // @ApiProperty({
  //   description: 'List of Ids from this Admins that can only manage this Unity',
  //   example: '[c1234567, 456789abcdef, cdefcd1ef]',
  //   required: true,
  // })
  // adminIds: string[];
}

export class CreateUnityDto {
  @ApiProperty({
    description: 'Name of the Unity',
    example: 'Unity A',
    required: true,
  })
  name: string;

  @ApiProperty({
    description: 'Unity Address',
    example: 'Unity address in the Unity format.',
    required: false,
  })
  address?: string;

  @ApiProperty({
    description: 'Unity Phone Number',
    example: '+1-234-567-8900',
    required: false,
  })
  phone?: string;

  @ApiProperty({
    description: 'Id of the Unity it belongs to',
    example: 'c1234567-89ab-cdef-0123-456789abcdef',
  })
  clientId: string;

  // @ApiProperty({
  //   description: 'List of Queue from this Unity',
  //   example: '[c1234567, 456789abcdef, cdefcd1ef]',
  //   required: true,
  // })
  // queueIds: string[];

  // @ApiProperty({
  //   description: 'List of Ids from this Admins that can only manage this unity',
  //   example: '[c1234567, 456789abcdef, cdefcd1ef]',
  //   required: true,
  // })
  // adminIds: string[];
}
export class InputGetUnitiesByIdDto {
  unitiesIds: string[];
}

export class InputUpdateUnityDto {
  payload: Partial<Omit<CreateUnityDto, 'clientId'>>;
  unityId: string;
}
