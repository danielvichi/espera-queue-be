import { Request } from 'express';
import { AdminResponseDto } from 'src/admin/admin.dto';

export interface AuthenticatedRequestDto extends Request {
  user: AdminResponseDto;
}
