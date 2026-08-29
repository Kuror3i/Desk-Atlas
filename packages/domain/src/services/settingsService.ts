import type { DeskAtlasUser } from '../models/user';
import type { OperatingHoursInterval } from '../models/availability';
import type {
  AdminPaymentMethod,
  BusinessClosureException,
  BusinessOperatingHoursMode,
  BusinessSettings,
  CreateBusinessClosureInput,
  OperatingHoursConfig,
  OperatingHoursDaySchedule,
  SettingsOverview,
  UpdateBusinessSettingsInput,
  UpdateOperatingHoursInput,
  UpdatePaymentMethodInput,
} from '../models/settings';
import type { SettingsRepository } from './settingsRepository';

export class SettingsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SettingsValidationError';
  }
}

export function createAdminSettingsService(repository: SettingsRepository) {
  return {
    async getSettingsOverview(): Promise<SettingsOverview> {
      const [businessSettings, rawOperatingHours, paymentMethods] = await Promise.all([
        repository.getBusinessSettings(),
        repository.listOperatingHours(),
        repository.listPaymentMethods(),
      ]);

      const operatingHoursConfig = buildOperatingHoursConfig(rawOperatingHours);

      return {
        businessSettings,
        operatingHoursConfig,
        paymentMethods,
      };
    },

    async updateBusinessSettings(
      input: UpdateBusinessSettingsInput,
      actor?: DeskAtlasUser | null
    ): Promise<BusinessSettings> {
      const normalized = normalizeBusinessSettingsInput(input);
      return repository.updateBusinessSettings(normalized, actor?.id ?? null);
    },

    async updateOperatingHours(
      input: UpdateOperatingHoursInput,
      _actor?: DeskAtlasUser | null
    ): Promise<OperatingHoursConfig> {
      const intervalsToSave = normalizeOperatingHoursInput(input);
      const saved = await repository.replaceOperatingHours(intervalsToSave);
      return buildOperatingHoursConfig(saved);
    },

    async updatePaymentMethod(
      input: UpdatePaymentMethodInput,
      _actor?: DeskAtlasUser | null
    ): Promise<AdminPaymentMethod> {
      const normalized = normalizePaymentMethodInput(input);
      return repository.updatePaymentMethod(normalized);
    },

    async listClosures(): Promise<BusinessClosureException[]> {
      const [businessSettings, rawBlocks] = await Promise.all([
        repository.getBusinessSettings(),
        repository.listBusinessScheduleBlocks(),
      ]);

      const timezone = businessSettings.timezone;
      const closureBlocks = rawBlocks.filter((b) => b.blockType === 'CLOSURE');
      const exceptions: BusinessClosureException[] = [];
      const partialBlocksByDate = new Map<string, typeof closureBlocks>();

      for (const block of closureBlocks) {
        const startZoned = utcToZonedDateTime(new Date(block.startAt), timezone);
        const endZoned = utcToZonedDateTime(new Date(block.endAt), timezone);

        const isFullDayAligned = startZoned.time === '00:00' && endZoned.time === '00:00';
        if (isFullDayAligned) {
          const startDay = startZoned.date;
          const endDay = addDays(endZoned.date, -1);
          const isMultiDay = endDay > startDay;
          exceptions.push({
            id: block.id,
            date: startDay,
            endDate: isMultiDay ? endDay : null,
            closureType: 'FULL_DAY',
            opensAt: null,
            closesAt: null,
            reason: block.reason,
            blockIds: [block.id],
          });
        } else {
          const list = partialBlocksByDate.get(startZoned.date) ?? [];
          list.push(block);
          partialBlocksByDate.set(startZoned.date, list);
        }
      }

      for (const [date, blocks] of partialBlocksByDate.entries()) {
        let opensAt: string | null = null;
        let closesAt: string | null = null;
        const blockIds = blocks.map((b) => b.id);
        const reason = blocks[0]?.reason ?? null;

        for (const b of blocks) {
          const bStartZoned = utcToZonedDateTime(new Date(b.startAt), timezone);
          const bEndZoned = utcToZonedDateTime(new Date(b.endAt), timezone);

          if (bStartZoned.time === '00:00') {
            opensAt = bEndZoned.time;
          }
          if (bEndZoned.time === '00:00') {
            closesAt = bStartZoned.time;
          }
        }

        exceptions.push({
          id: blockIds[0] ?? `special-${date}`,
          date,
          endDate: null,
          closureType: 'SPECIAL_HOURS',
          opensAt: opensAt ?? '00:00',
          closesAt: closesAt ?? '24:00',
          reason,
          blockIds,
        });
      }

      return exceptions.sort((a, b) => a.date.localeCompare(b.date));
    },

    async createClosure(
      input: CreateBusinessClosureInput,
      actor?: DeskAtlasUser | null
    ): Promise<BusinessClosureException> {
      if (!input.date || typeof input.date !== 'string' || !isValidDateString(input.date)) {
        throw new SettingsValidationError(`Invalid date format: ${input.date}. Expected YYYY-MM-DD`);
      }

      if (input.endDate && (!isValidDateString(input.endDate) || input.endDate < input.date)) {
        throw new SettingsValidationError('End date must be on or after start date');
      }

      const businessSettings = await repository.getBusinessSettings();
      const timezone = businessSettings.timezone;

      if (input.closureType === 'FULL_DAY') {
        const startDate = input.date;
        const endDate = input.endDate || input.date;

        const startUtc = zonedDateTimeToUtc(startDate, '00:00:00', timezone);
        const endUtc = zonedDateTimeToUtc(addDays(endDate, 1), '00:00:00', timezone);

        await repository.deleteBusinessScheduleBlocksForDateRange(
          startUtc.toISOString(),
          endUtc.toISOString()
        );

        const block = await repository.createScheduleBlock({
          scope: 'BUSINESS',
          blockType: 'CLOSURE',
          startAt: startUtc.toISOString(),
          endAt: endUtc.toISOString(),
          reason: input.reason?.trim() || null,
          createdByUserId: actor?.id ?? null,
        });

        return {
          id: block.id,
          date: startDate,
          endDate: endDate !== startDate ? endDate : null,
          closureType: 'FULL_DAY',
          opensAt: null,
          closesAt: null,
          reason: block.reason,
          blockIds: [block.id],
        };
      }

      if (input.closureType === 'SPECIAL_HOURS') {
        if (input.endDate && input.endDate !== input.date) {
          throw new SettingsValidationError('Special opening hours must be configured for a single date');
        }

        if (!input.opensAt || !input.closesAt) {
          throw new SettingsValidationError('Opens at and closes at times are required for special hours');
        }

        const opensAtNorm = normalizeTimeDisplay(input.opensAt);
        const closesAtNorm = normalizeTimeDisplay(input.closesAt);

        const openMinutes = parseTimeToMinutes(opensAtNorm);
        const closeMinutes = parseTimeToMinutes(closesAtNorm);

        if (openMinutes >= closeMinutes) {
          throw new SettingsValidationError(
            `Opening time (${opensAtNorm}) must be strictly before closing time (${closesAtNorm})`
          );
        }

        const dayStartUtc = zonedDateTimeToUtc(input.date, '00:00:00', timezone);
        const dayEndUtc = zonedDateTimeToUtc(addDays(input.date, 1), '00:00:00', timezone);

        await repository.deleteBusinessScheduleBlocksForDateRange(
          dayStartUtc.toISOString(),
          dayEndUtc.toISOString()
        );

        const blockIds: string[] = [];

        // Block 1: From start of day to opensAt
        if (opensAtNorm !== '00:00') {
          const b1Start = zonedDateTimeToUtc(input.date, '00:00:00', timezone);
          const b1End = zonedDateTimeToUtc(input.date, opensAtNorm, timezone);
          const b1 = await repository.createScheduleBlock({
            scope: 'BUSINESS',
            blockType: 'CLOSURE',
            startAt: b1Start.toISOString(),
            endAt: b1End.toISOString(),
            reason: input.reason?.trim() || null,
            createdByUserId: actor?.id ?? null,
          });
          blockIds.push(b1.id);
        }

        // Block 2: From closesAt to end of day
        if (closesAtNorm !== '24:00' && closesAtNorm !== '23:59') {
          const b2Start = zonedDateTimeToUtc(input.date, closesAtNorm, timezone);
          const b2End = zonedDateTimeToUtc(addDays(input.date, 1), '00:00:00', timezone);
          const b2 = await repository.createScheduleBlock({
            scope: 'BUSINESS',
            blockType: 'CLOSURE',
            startAt: b2Start.toISOString(),
            endAt: b2End.toISOString(),
            reason: input.reason?.trim() || null,
            createdByUserId: actor?.id ?? null,
          });
          blockIds.push(b2.id);
        }

        return {
          id: blockIds[0] ?? `special-${input.date}`,
          date: input.date,
          endDate: null,
          closureType: 'SPECIAL_HOURS',
          opensAt: opensAtNorm,
          closesAt: closesAtNorm,
          reason: input.reason?.trim() || null,
          blockIds,
        };
      }

      throw new SettingsValidationError(`Unsupported closure type: ${input.closureType}`);
    },

    async deleteClosure(blockIds: string[], _actor?: DeskAtlasUser | null): Promise<void> {
      if (!Array.isArray(blockIds) || blockIds.length === 0) {
        throw new SettingsValidationError('At least one block ID is required');
      }
      await repository.deleteScheduleBlocks(blockIds);
    },
  };
}


export function buildOperatingHoursConfig(
  rawIntervals: OperatingHoursInterval[]
): OperatingHoursConfig {
  const activeIntervals = rawIntervals.filter((i) => i.isActive);
  const schedules: OperatingHoursDaySchedule[] = [];

  for (let day = 0; day <= 6; day++) {
    const dayIntervals = activeIntervals
      .filter((i) => i.dayOfWeek === day)
      .sort((a, b) => a.opensAt.localeCompare(b.opensAt));

    const isOpen = dayIntervals.length > 0;
    const is24Hours =
      isOpen &&
      dayIntervals.some(
        (i) =>
          (i.opensAt === '00:00:00' || i.opensAt === '00:00') &&
          (i.closesAt === '24:00:00' || i.closesAt === '24:00' || i.closesAt === '23:59:59')
      );

    schedules.push({
      dayOfWeek: day,
      isOpen,
      is24Hours,
      intervals: dayIntervals.map((i) => ({
        id: i.id,
        opensAt: normalizeTimeDisplay(i.opensAt),
        closesAt: normalizeTimeDisplay(i.closesAt),
      })),
    });
  }

  // Determine mode
  const allOpen = schedules.every((s) => s.isOpen);
  const all24Hours = schedules.every((s) => s.isOpen && s.is24Hours);
  const openDaysAre24Hours =
    schedules.some((s) => s.isOpen) &&
    schedules.filter((s) => s.isOpen).every((s) => s.is24Hours) &&
    schedules.some((s) => !s.isOpen);

  let mode: BusinessOperatingHoursMode = 'CUSTOM_HOURS';
  if (allOpen && all24Hours) {
    mode = '24_7';
  } else if (openDaysAre24Hours) {
    mode = '24_HOURS_SELECTED_DAYS';
  }

  return {
    mode,
    schedules,
  };
}

function normalizeBusinessSettingsInput(
  input: UpdateBusinessSettingsInput
): UpdateBusinessSettingsInput {
  if (!input.businessName || typeof input.businessName !== 'string' || !input.businessName.trim()) {
    throw new SettingsValidationError('Business name is required');
  }

  if (!input.timezone || typeof input.timezone !== 'string' || !input.timezone.trim()) {
    throw new SettingsValidationError('Timezone is required');
  }

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: input.timezone.trim() });
  } catch {
    throw new SettingsValidationError(`Invalid IANA timezone: ${input.timezone}`);
  }

  if (
    !Number.isInteger(input.bookingIntervalMinutes) ||
    input.bookingIntervalMinutes <= 0 ||
    input.bookingIntervalMinutes > 1440
  ) {
    throw new SettingsValidationError(
      'Booking interval must be a positive integer between 1 and 1440 minutes'
    );
  }

  if (!Number.isInteger(input.paymentExpiryMinutes) || input.paymentExpiryMinutes <= 0) {
    throw new SettingsValidationError('Payment expiry must be a positive integer in minutes');
  }

  if (
    input.kioskTimeoutMinutes !== undefined &&
    input.kioskTimeoutMinutes !== null &&
    (!Number.isInteger(input.kioskTimeoutMinutes) || input.kioskTimeoutMinutes <= 0)
  ) {
    throw new SettingsValidationError('Kiosk timeout must be a positive integer in minutes');
  }

  return {
    businessName: input.businessName.trim(),
    timezone: input.timezone.trim(),
    contactEmail: input.contactEmail?.trim() || null,
    contactPhone: input.contactPhone?.trim() || null,
    bookingIntervalMinutes: input.bookingIntervalMinutes,
    paymentExpiryMinutes: input.paymentExpiryMinutes,
    kioskTimeoutMinutes: input.kioskTimeoutMinutes ?? null,
  };
}

function normalizeOperatingHoursInput(
  input: UpdateOperatingHoursInput
): Array<{ dayOfWeek: number; opensAt: string; closesAt: string; isActive: boolean }> {
  if (!input.schedules || !Array.isArray(input.schedules)) {
    throw new SettingsValidationError('Schedules array is required');
  }

  const result: Array<{
    dayOfWeek: number;
    opensAt: string;
    closesAt: string;
    isActive: boolean;
  }> = [];

  if (input.mode === '24_7') {
    for (let day = 0; day <= 6; day++) {
      result.push({
        dayOfWeek: day,
        opensAt: '00:00:00',
        closesAt: '24:00:00',
        isActive: true,
      });
    }
    return result;
  }

  if (input.mode === '24_HOURS_SELECTED_DAYS') {
    for (const s of input.schedules) {
      if (s.dayOfWeek < 0 || s.dayOfWeek > 6) {
        throw new SettingsValidationError(`Invalid day of week: ${s.dayOfWeek}`);
      }
      if (s.isOpen) {
        result.push({
          dayOfWeek: s.dayOfWeek,
          opensAt: '00:00:00',
          closesAt: '24:00:00',
          isActive: true,
        });
      }
    }
    return result;
  }

  // Custom hours
  for (const s of input.schedules) {
    if (s.dayOfWeek < 0 || s.dayOfWeek > 6) {
      throw new SettingsValidationError(`Invalid day of week: ${s.dayOfWeek}`);
    }

    if (!s.isOpen) {
      continue;
    }

    if (s.is24Hours) {
      result.push({
        dayOfWeek: s.dayOfWeek,
        opensAt: '00:00:00',
        closesAt: '24:00:00',
        isActive: true,
      });
      continue;
    }

    const intervals = s.intervals && s.intervals.length > 0 ? s.intervals : [];
    if (intervals.length === 0) {
      throw new SettingsValidationError(`Open day ${s.dayOfWeek} must have at least one time interval`);
    }

    for (const interval of intervals) {
      const opensAt = formatTimeForDb(interval.opensAt);
      const closesAt = formatTimeForDb(interval.closesAt);

      const openMinutes = parseTimeToMinutes(opensAt);
      const closeMinutes = parseTimeToMinutes(closesAt);

      if (openMinutes >= closeMinutes) {
        throw new SettingsValidationError(
          `Opening time (${interval.opensAt}) must be strictly before closing time (${interval.closesAt})`
        );
      }

      result.push({
        dayOfWeek: s.dayOfWeek,
        opensAt,
        closesAt,
        isActive: true,
      });
    }
  }

  return result;
}

function normalizePaymentMethodInput(input: UpdatePaymentMethodInput): UpdatePaymentMethodInput {
  if (!input.id || typeof input.id !== 'string' || !input.id.trim()) {
    throw new SettingsValidationError('Payment method ID is required');
  }

  if (!input.displayName || typeof input.displayName !== 'string' || !input.displayName.trim()) {
    throw new SettingsValidationError('Display name is required');
  }

  return {
    id: input.id.trim(),
    displayName: input.displayName.trim(),
    accountName: input.accountName?.trim() || null,
    accountNumber: input.accountNumber?.trim() || null,
    qrImagePath: input.qrImagePath?.trim() || null,
    instructions: input.instructions?.trim() || null,
    allowWeb: Boolean(input.allowWeb),
    allowKiosk: Boolean(input.allowKiosk),
    isActive: Boolean(input.isActive),
    displayOrder:
      input.displayOrder !== undefined && Number.isInteger(input.displayOrder) && input.displayOrder >= 0
        ? input.displayOrder
        : 0,
  };
}

function formatTimeForDb(timeStr: string): string {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) {
    throw new SettingsValidationError(`Invalid time format: ${timeStr}`);
  }

  const hours = String(Number(match[1])).padStart(2, '0');
  const minutes = match[2];
  const seconds = match[3] ?? '00';
  return `${hours}:${minutes}:${seconds}`;
}

function normalizeTimeDisplay(timeStr: string): string {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return timeStr;
  const hours = String(Number(match[1])).padStart(2, '0');
  return `${hours}:${match[2]}`;
}

function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.match(/^(\d{2}):(\d{2})/);
  if (!match) return 0;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function isValidDateString(dateStr: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) && !isNaN(new Date(dateStr).getTime());
}

export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const value = new Date(Date.UTC(year, month - 1, day + days));
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}-${String(
    value.getUTCDate()
  ).padStart(2, '0')}`;
}

export function zonedDateTimeToUtc(date: string, time: string, timezone: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  const timeParts = time.split(':').map(Number);
  const hours = timeParts[0] ?? 0;
  const minutes = timeParts[1] ?? 0;
  const seconds = timeParts[2] ?? 0;

  let utcTimestamp = Date.UTC(year, month - 1, day, hours, minutes, seconds);

  for (let iteration = 0; iteration < 2; iteration += 1) {
    const offsetMinutes = getTimezoneOffsetMinutes(new Date(utcTimestamp), timezone);
    utcTimestamp = Date.UTC(year, month - 1, day, hours, minutes, seconds) - offsetMinutes * 60_000;
  }

  return new Date(utcTimestamp);
}

export function getTimezoneOffsetMinutes(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)])
  ) as Record<'year' | 'month' | 'day' | 'hour' | 'minute' | 'second', number>;

  const zonedAsUtc = Date.UTC(
    values.year,
    values.month - 1,
    values.day,
    values.hour,
    values.minute,
    values.second
  );

  return Math.round((zonedAsUtc - date.getTime()) / 60_000);
}

export function utcToZonedDateTime(date: Date, timezone: string): { date: string; time: string } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const parts = formatter.formatToParts(date);
  const partMap: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      partMap[part.type] = part.value;
    }
  }
  const y = partMap.year ?? '1970';
  const m = (partMap.month ?? '01').padStart(2, '0');
  const d = (partMap.day ?? '01').padStart(2, '0');
  let h = partMap.hour ?? '00';
  if (h === '24') h = '00';
  const min = (partMap.minute ?? '00').padStart(2, '0');
  return {
    date: `${y}-${m}-${d}`,
    time: `${h.padStart(2, '0')}:${min.padStart(2, '0')}`,
  };
}

