import { Request } from 'express';
import { AdminWithClientDto } from 'src/admin/admin.dto';

export interface AuthenticatedRequestDto extends Request {
  user: AdminWithClientDto;
}
