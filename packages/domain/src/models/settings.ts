export type BusinessOperatingHoursMode = '24_7' | '24_HOURS_SELECTED_DAYS' | 'CUSTOM_HOURS';

export interface BusinessSettings {
  id: number;
  businessName: string;
  timezone: string;
  contactEmail: string | null;
  contactPhone: string | null;
  bookingIntervalMinutes: number;
  paymentExpiryMinutes: number;
  kioskTimeoutMinutes: number | null;
  updatedAt?: string | null;
}

export interface OperatingHoursDaySchedule {
  dayOfWeek: number;
  isOpen: boolean;
  is24Hours: boolean;
  intervals: Array<{
    id?: string;
    opensAt: string;
    closesAt: string;
  }>;
}

export interface OperatingHoursConfig {
  mode: BusinessOperatingHoursMode;
  schedules: OperatingHoursDaySchedule[];
}

export interface AdminPaymentMethod {
  id: string;
  methodType: 'GCASH' | 'BANK' | 'CASH';
  displayName: string;
  accountName: string | null;
  accountNumber: string | null;
  qrImagePath: string | null;
  instructions: string | null;
  allowWeb: boolean;
  allowKiosk: boolean;
  isActive: boolean;
  displayOrder: number;
}

export interface UpdateBusinessSettingsInput {
  businessName: string;
  timezone: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  bookingIntervalMinutes: number;
  paymentExpiryMinutes: number;
  kioskTimeoutMinutes?: number | null;
}

export interface UpdateOperatingHoursInput {
  mode?: BusinessOperatingHoursMode;
  schedules: Array<{
    dayOfWeek: number;
    isOpen: boolean;
    is24Hours?: boolean;
    intervals?: Array<{
      opensAt: string;
      closesAt: string;
    }>;
  }>;
}

export interface UpdatePaymentMethodInput {
  id: string;
  displayName: string;
  accountName?: string | null;
  accountNumber?: string | null;
  qrImagePath?: string | null;
  instructions?: string | null;
  allowWeb: boolean;
  allowKiosk: boolean;
  isActive: boolean;
  displayOrder?: number;
}

export interface SettingsOverview {
  businessSettings: BusinessSettings;
  operatingHoursConfig: OperatingHoursConfig;
  paymentMethods: AdminPaymentMethod[];
}

export type BusinessClosureType = 'FULL_DAY' | 'SPECIAL_HOURS';

export interface BusinessClosureException {
  id: string;
  date: string;
  endDate?: string | null;
  closureType: BusinessClosureType;
  opensAt: string | null;
  closesAt: string | null;
  reason: string | null;
  createdAt?: string;
  blockIds: string[];
}

export interface CreateBusinessClosureInput {
  date: string;
  endDate?: string | null;
  closureType: BusinessClosureType;
  opensAt?: string | null;
  closesAt?: string | null;
  reason?: string | null;
}

