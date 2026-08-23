export type AppRole = 'customer' | 'staff' | 'admin';

export interface DeskAtlasUser {
  id: string;
  name: string;
  role: AppRole;
}
