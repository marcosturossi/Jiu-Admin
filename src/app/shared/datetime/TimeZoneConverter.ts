import { DateTime } from 'luxon';

export class TimeZoneConverter {
  // Define the instance time zone as a property
  private readonly TIME_ZONE: string;

  // Define the default time zone as a static constant
  private static readonly DEFAULT_TIME_ZONE = 'utc';

  // Constructor with optional time zone parameter
  constructor(timeZone: string = 'America/Sao_Paulo') {
    this.TIME_ZONE = timeZone;
  }

  // Instance method: Convert a DateTime from the default time zone to the instance time zone
  convertToTimeZone(dateTime: DateTime): DateTime {
    return dateTime.setZone(this.TIME_ZONE);
  }

  // Instance method: Convert a DateTime from the instance time zone to the default time zone
  convertFromTimeZone(dateTime: DateTime): DateTime {
    return dateTime.setZone(TimeZoneConverter.DEFAULT_TIME_ZONE);
  }

  // Instance method: Convert a JavaScript Date object from the default time zone to the instance time zone
  convertDateToTimeZone(date: Date): DateTime {
    const dateTime = DateTime.fromJSDate(date).setZone(TimeZoneConverter.DEFAULT_TIME_ZONE);
    return this.convertToTimeZone(dateTime);
  }

  // Instance method: Convert a JavaScript Date object from the instance time zone to the default time zone
  convertDateFromTimeZone(date: Date): DateTime {
    const dateTime = DateTime.fromJSDate(date).setZone(this.TIME_ZONE);
    return this.convertFromTimeZone(dateTime);
  }

  // Static method: Utility method to get current time in the instance time zone
  static getCurrentTimeInTimeZone(timeZone: string): DateTime {
    return DateTime.now().setZone(timeZone);
  }
}