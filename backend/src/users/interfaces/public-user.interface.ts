import { Role } from '../../common/enums/role.enum';

export interface PublicUser {
  id: string;
  username: string;
  dateOfBirth: string;
  role: Role;
  interests: string[];
  createdAt: Date;
  updatedAt: Date;
}
