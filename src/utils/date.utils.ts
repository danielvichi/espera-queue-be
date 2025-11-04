import { DateTime } from 'luxon';

interface IsTodayArgs {
  date: Date;
}

export function isToday(data: IsTodayArgs): boolean {
  if (!data.date) {
    throw new Error('isToday() - Date is required');
  }

  if (!(data.date instanceof Date)) {
    throw new Error(`isToday() - Invalid date`);
  }

  const now = DateTime.now();
  const targetDate = DateTime.fromJSDate(data.date);

  const isThisYear = now.year === targetDate.year;
  const isThisMonth = now.month === targetDate.month;
  const isToday = now.day === targetDate.day;

  if (isThisYear && isThisMonth && isToday) {
    return true;
  }

  return false;
}
