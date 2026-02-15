import { eachDayOfInterval, isWeekend, format, parseISO } from "date-fns";

interface BankHoliday {
  title: string;
  date: string;
  bunting: boolean;
}

interface BankHolidayResponse {
  "england-and-wales": {
    division: string;
    events: BankHoliday[];
  };
}

/**
 * Cache for bank holidays: { data, fetchedAt }.
 * Re-fetched if older than 24 hours.
 */
let bankHolidayCache: { dates: Set<string>; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Static fallback bank holidays for 2026 (England and Wales).
 * Used if the GOV.UK API is unavailable.
 */
const FALLBACK_BANK_HOLIDAYS_2026 = [
  "2026-01-01", // New Year's Day
  "2026-04-03", // Good Friday
  "2026-04-06", // Easter Monday
  "2026-05-04", // Early May bank holiday
  "2026-05-25", // Spring bank holiday
  "2026-08-31", // Summer bank holiday
  "2026-12-25", // Christmas Day
  "2026-12-28", // Boxing Day (substitute)
];

/**
 * WorkingDaysService calculates working days lost excluding weekends and UK bank holidays.
 * Fetches bank holiday data from the GOV.UK API with 24h in-memory cache.
 */
export class WorkingDaysService {
  /**
   * Fetch UK bank holidays from the GOV.UK API.
   * Uses 24h in-memory cache. Falls back to static 2026 data if API fails.
   */
  static async getBankHolidays(): Promise<Set<string>> {
    // Return cached data if still fresh
    if (bankHolidayCache && Date.now() - bankHolidayCache.fetchedAt < CACHE_TTL_MS) {
      return bankHolidayCache.dates;
    }

    try {
      const response = await fetch("https://www.gov.uk/bank-holidays.json", {
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`GOV.UK API returned ${response.status}`);
      }

      const data: BankHolidayResponse = await response.json();
      const englandWales = data["england-and-wales"];

      if (!englandWales?.events) {
        throw new Error("Invalid response structure from GOV.UK API");
      }

      const dates = new Set(englandWales.events.map((event) => event.date));

      bankHolidayCache = { dates, fetchedAt: Date.now() };
      return dates;
    } catch (error) {
      console.warn("Failed to fetch bank holidays from GOV.UK API, using fallback:", error);

      // Use static fallback
      const dates = new Set(FALLBACK_BANK_HOLIDAYS_2026);
      bankHolidayCache = { dates, fetchedAt: Date.now() };
      return dates;
    }
  }

  /**
   * Calculate the number of working days lost between two dates (inclusive).
   * Excludes weekends (Saturday/Sunday) and UK bank holidays.
   *
   * @param startDate - ISO date string (YYYY-MM-DD)
   * @param endDate - ISO date string (YYYY-MM-DD)
   * @returns Number of working days in the interval
   */
  static async calculateWorkingDaysLost(startDate: string, endDate: string): Promise<number> {
    const start = parseISO(startDate);
    const end = parseISO(endDate);

    if (end < start) return 0;

    const bankHolidays = await WorkingDaysService.getBankHolidays();

    const allDays = eachDayOfInterval({ start, end });

    const workingDays = allDays.filter((day) => {
      if (isWeekend(day)) return false;
      const dateStr = format(day, "yyyy-MM-dd");
      if (bankHolidays.has(dateStr)) return false;
      return true;
    });

    return workingDays.length;
  }
}
