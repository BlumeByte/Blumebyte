/**
 * Business Days Calculator
 * Automatically excludes weekends and company holidays from leave calculations
 */

// Configurable company holidays (can be updated by HR)
export const COMPANY_HOLIDAYS_2025: Date[] = [
  new Date('2025-01-01'), // New Year's Day
  new Date('2025-04-18'), // Good Friday
  new Date('2025-04-21'), // Easter Monday
  new Date('2025-05-01'), // Workers' Day
  new Date('2025-05-29'), // Democracy Day
  new Date('2025-06-12'), // Eid al-Adha (estimated)
  new Date('2025-10-01'), // Independence Day
  new Date('2025-12-25'), // Christmas Day
  new Date('2025-12-26'), // Boxing Day
];

export const COMPANY_HOLIDAYS_2026: Date[] = [
  new Date('2026-01-01'), // New Year's Day
  new Date('2026-04-03'), // Good Friday
  new Date('2026-04-06'), // Easter Monday
  new Date('2026-05-01'), // Workers' Day
  new Date('2026-05-27'), // Democracy Day
  new Date('2026-06-01'), // Eid al-Adha (estimated)
  new Date('2026-10-01'), // Independence Day
  new Date('2026-12-25'), // Christmas Day
  new Date('2026-12-26'), // Boxing Day
];

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Check if a date is a company holiday
 */
export function isHoliday(date: Date): boolean {
  const dateStr = date.toISOString().split('T')[0];
  
  const allHolidays = [...COMPANY_HOLIDAYS_2025, ...COMPANY_HOLIDAYS_2026];
  
  return allHolidays.some(holiday => {
    const holidayStr = holiday.toISOString().split('T')[0];
    return holidayStr === dateStr;
  });
}

/**
 * Check if a date is a business day (not weekend or holiday)
 */
export function isBusinessDay(date: Date): boolean {
  return !isWeekend(date) && !isHoliday(date);
}

/**
 * Calculate the number of business days between two dates (inclusive)
 * Automatically excludes weekends and holidays
 */
export function calculateBusinessDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  
  // Ensure endDate is not before startDate
  if (endDate < startDate) {
    return 0;
  }
  
  while (current <= endDate) {
    if (isBusinessDay(current)) {
      count++;
    }
    // Move to next day
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

/**
 * Get all business days between two dates
 */
export function getBusinessDaysList(startDate: Date, endDate: Date): Date[] {
  const businessDays: Date[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    if (isBusinessDay(current)) {
      businessDays.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  
  return businessDays;
}

/**
 * Get all non-business days (weekends + holidays) between two dates
 */
export function getNonBusinessDays(startDate: Date, endDate: Date): { date: Date; type: 'weekend' | 'holiday' }[] {
  const nonBusinessDays: { date: Date; type: 'weekend' | 'holiday' }[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    if (!isBusinessDay(current)) {
      nonBusinessDays.push({
        date: new Date(current),
        type: isWeekend(current) ? 'weekend' : 'holiday'
      });
    }
    current.setDate(current.getDate() + 1);
  }
  
  return nonBusinessDays;
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

/**
 * Get holiday name if date is a holiday
 */
export function getHolidayName(date: Date): string | null {
  const dateStr = date.toISOString().split('T')[0];
  
  const holidays = {
    '2025-01-01': "New Year's Day",
    '2025-04-18': 'Good Friday',
    '2025-04-21': 'Easter Monday',
    '2025-05-01': "Workers' Day",
    '2025-05-29': 'Democracy Day',
    '2025-06-12': 'Eid al-Adha',
    '2025-10-01': 'Independence Day',
    '2025-12-25': 'Christmas Day',
    '2025-12-26': 'Boxing Day',
    '2026-01-01': "New Year's Day",
    '2026-04-03': 'Good Friday',
    '2026-04-06': 'Easter Monday',
    '2026-05-01': "Workers' Day",
    '2026-05-27': 'Democracy Day',
    '2026-06-01': 'Eid al-Adha',
    '2026-10-01': 'Independence Day',
    '2026-12-25': 'Christmas Day',
    '2026-12-26': 'Boxing Day',
  };
  
  return holidays[dateStr as keyof typeof holidays] || null;
}
