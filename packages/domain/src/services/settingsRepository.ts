import type {
  AdminPaymentMethod,
  BusinessSettings,
  UpdateBusinessSettingsInput,
  UpdatePaymentMethodInput,
} from '../models/settings';
import type { OperatingHoursInterval, ScheduleBlock } from '../models/availability';

export interface SettingsRepository {
  getBusinessSettings(): Promise<BusinessSettings>;
  updateBusinessSettings(
    input: UpdateBusinessSettingsInput,
    updatedByUserId?: string | null
  ): Promise<BusinessSettings>;
  listOperatingHours(): Promise<OperatingHoursInterval[]>;
  replaceOperatingHours(
    intervals: Array<{
      dayOfWeek: number;
      opensAt: string;
      closesAt: string;
      isActive?: boolean;
    }>
  ): Promise<OperatingHoursInterval[]>;
  listPaymentMethods(): Promise<AdminPaymentMethod[]>;
  updatePaymentMethod(input: UpdatePaymentMethodInput): Promise<AdminPaymentMethod>;
  listBusinessScheduleBlocks(): Promise<ScheduleBlock[]>;
  createScheduleBlock(block: {
    scope: 'BUSINESS' | 'WORKSPACE';
    workspaceInstanceId?: string | null;
    blockType: string;
    startAt: string;
    endAt: string;
    reason?: string | null;
    createdByUserId?: string | null;
  }): Promise<ScheduleBlock>;
  deleteScheduleBlocks(ids: string[]): Promise<void>;
  deleteBusinessScheduleBlocksForDateRange(startIso: string, endIso: string): Promise<void>;
}

