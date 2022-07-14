const { utils } = require('@aeternity/aeproject');

const chai = require('chai');
const assert = chai.assert;
const assertNode = require('assert').strict;

const {
  timeUnits,
  timePeriod,
  getRandom,
  generateRandomDateTime,
  generateRandomNumber,
  generateRandomTimeStamp,
  getMonthDifference
} = require('../utils/datetime-utils');

describe('LibraryUsage', () => {
  let libraryUsageInstance;

  before(async () => {
    const aeSdk = await utils.getSdk();
    try {
      // path relative to root of project
      const LIBRARY_USAGE_SOURCE = './contracts/Libraries/LibraryUsage.aes';
      // get fileSystem for includes
      const fileSystem = utils.getFilesystem(LIBRARY_USAGE_SOURCE)
      const contractContent = utils.getContractContent(LIBRARY_USAGE_SOURCE);
      // initialize the contract instance
      libraryUsageInstance = await aeSdk.getContractInstance({ source: contractContent, fileSystem });
    } catch(err) {
      console.error(err);
      assert.fail('Could not initialize contract instance');
    }
  });

  describe('Deploy contract', () => {
    it('should deploy LibraryUsage contract', async () => {
      const init = await libraryUsageInstance.deploy([]);
      assert.equal(init.result.returnType, 'ok');
    });
  });

  describe('BaseConverter Library', () => {
    it('should convert decimal to binary', async () => {
      const result = await libraryUsageInstance.methods.dec_to_binary(72);
      assert.equal(result.decodedResult, "1001000");
    });

    it('should convert decimal to octal', async () => {
      const result = await libraryUsageInstance.methods.dec_to_oct(98);
      assert.equal(result.decodedResult, "142");
    });

    it('should convert decimal to hexadecimal', async () => {
      const result = await libraryUsageInstance.methods.dec_to_hex(45);
      assert.equal(result.decodedResult, "2D");
    });

    it('should convert binary to decimal', async () => {
      const result = await libraryUsageInstance.methods.binary_to_dec(1001000);
      assert.equal(result.decodedResult, "72");
    });

    it('should convert oct to decimal', async () => {
      const result = await libraryUsageInstance.methods.oct_to_dec(142);
      assert.equal(result.decodedResult, "98");
    });
  });

  describe('DateTime Library', () => {
    const ONE_MINUTE = 60;
    const ONE_HOUR = 60 * ONE_MINUTE;
    const ONE_DAY = 24 * ONE_HOUR;
  
    let randomDate = generateRandomDateTime();
    let year = randomDate.getFullYear();
    let month = randomDate.getMonth() + 1;
    let day = randomDate.getDate();
    let hour = randomDate.getHours();
    let minute = randomDate.getMinutes();
    let second = randomDate.getSeconds();
    let weekday = randomDate.getDay();
    let offset = randomDate.getTimezoneOffset();
    let local_diff = (offset * (-1)) * 60;
    let starting_timestamp = (randomDate.getTime() / 1000) + local_diff;
  
    let date_time;
    let dt_timestamp;
    let resultTimestamp;
    let result;
    let future_timestamp;
    let past_timestamp;

    it('should get correct year', async () => {
      result = (await libraryUsageInstance.methods.get_year(starting_timestamp)).decodedResult;
      assert.equal(result, year);
    });
  
    it('should get correct month', async () => {
      result = (await libraryUsageInstance.methods.get_month(starting_timestamp)).decodedResult;
      assert.equal(result, month);
    });
  
    it('should get correct day', async () => {
      result = (await libraryUsageInstance.methods.get_day(starting_timestamp)).decodedResult;
      assert.equal(result, day);
    });
  
    it('should get correct hour', async () => {
      result = (await libraryUsageInstance.methods.get_hour(starting_timestamp)).decodedResult;
      assert.equal(result, hour);
    });
  
    it('should get correct minute', async () => {
      result = (await libraryUsageInstance.methods.get_minute(starting_timestamp)).decodedResult;
      assert.equal(result, minute);
    });
  
    it('should get correct second', async () => {
      result = (await libraryUsageInstance.methods.get_second(starting_timestamp)).decodedResult;
      assert.equal(result, second);
    });
  
    it('should get correct weekday', async () => {
      result = (await libraryUsageInstance.methods.get_weekday(starting_timestamp)).decodedResult;
      assert.equal(result, weekday);
    });
  
    it('should convert date to timestamp', async () => {
      result = (await libraryUsageInstance.methods.to_timestamp(year, month, day, hour, minute, second)).decodedResult;
      assert.equal(result, starting_timestamp);
    });
  
    it('check if the given year is leap', async () => {
      const leap = 2020;
      const not_leap = 2019;
      const is_leap = (await libraryUsageInstance.methods.is_leap_year(leap)).decodedResult;
      const is_not_leap = (await libraryUsageInstance.methods.is_leap_year(not_leap)).decodedResult;
  
      assert.equal(is_leap, 1);
      assert.equal(is_not_leap, 0);
    });
  
    it('should add more years to current timestamp', async () => {
      const YEAR_DIFF = generateRandomNumber();
      result = (await libraryUsageInstance.methods.add_years(starting_timestamp, YEAR_DIFF)).decodedResult;
      const actual_year = (await libraryUsageInstance.methods.get_year(result)).decodedResult;
      const expected_year = year + YEAR_DIFF;
  
      assert.equal(actual_year, expected_year);
    });
  
    it('should substract years from current timestamp', async () => {
      const YEAR_DIFF = generateRandomNumber();
      result = (await libraryUsageInstance.methods.sub_years(starting_timestamp, YEAR_DIFF)).decodedResult;
      const actual_year = (await libraryUsageInstance.methods.get_year(result)).decodedResult;
      const expected_year = year - YEAR_DIFF;
  
      assert.equal(actual_year, expected_year);
    });
  
  
    it('should add more months to current timestamp', async () => {
      date_time = generateRandomDateTime(timePeriod.past);
      const MONTHS_DIFF = generateRandomNumber();
      dt_timestamp = date_time.getTime() / 1000;
  
      resultTimestamp = (await libraryUsageInstance.methods.add_months(dt_timestamp, MONTHS_DIFF)).decodedResult;
      result = getMonthDifference(Number(resultTimestamp), dt_timestamp);
  
      assert.equal(result, MONTHS_DIFF);
    });
  
  
    it('should substract months from current timestamp', async () => {
      date_time = generateRandomDateTime();
      const MONTHS_DIFF = generateRandomNumber();
      dt_timestamp = date_time.getTime() / 1000;
  
      resultTimestamp = (await libraryUsageInstance.methods.sub_months(dt_timestamp, MONTHS_DIFF)).decodedResult;
      result = getMonthDifference(dt_timestamp, Number(resultTimestamp));
  
      assert.equal(result, MONTHS_DIFF);
    });
  
    it('should add more days to current timestamp', async () => {
      date_time = generateRandomDateTime();
      dt_timestamp = date_time.getTime() / 1000;

      const DAYS_DIFF = generateRandomNumber();
      resultTimestamp = (await libraryUsageInstance.methods.add_days(dt_timestamp, DAYS_DIFF)).decodedResult;
      result = (Number(resultTimestamp) - dt_timestamp) / ONE_DAY;

      assert.equal(result, DAYS_DIFF);
    });
  
    it('should substract days from timestamp', async () => {
      date_time = generateRandomDateTime();
      dt_timestamp = date_time.getTime() / 1000;

      const DAYS_DIFF = generateRandomNumber();
      resultTimestamp = (await libraryUsageInstance.methods.sub_days(dt_timestamp, DAYS_DIFF)).decodedResult;
      result = (dt_timestamp - Number(resultTimestamp)) / ONE_DAY;

      assert.equal(result, DAYS_DIFF);
    });
  
    it('should add hours to given timestamp', async () => {
      date_time = generateRandomDateTime();
      const HOUR_DIFF = generateRandomNumber();
  
      dt_timestamp = date_time.getTime() / 1000;
      resultTimestamp = (await libraryUsageInstance.methods.add_hours(dt_timestamp, HOUR_DIFF)).decodedResult;
      result = (Number(resultTimestamp) - dt_timestamp) / ONE_HOUR;
  
      assert.equal(result, HOUR_DIFF);
    });
  
    it('should substract hours from given timestamp', async () => {
      date_time = generateRandomDateTime();
      const HOUR_DIFF = generateRandomNumber();
  
      dt_timestamp = date_time.getTime() / 1000;
      resultTimestamp = (await libraryUsageInstance.methods.sub_hours(dt_timestamp, HOUR_DIFF)).decodedResult;
      result = (dt_timestamp - Number(resultTimestamp)) / ONE_HOUR;
  
      assert.equal(result, HOUR_DIFF);
    });
  
    it('should add more minutes to current timestamp', async () => {
      date_time = generateRandomDateTime();
      const MIN_DIFF = generateRandomNumber();
  
      dt_timestamp = date_time.getTime() / 1000
      resultTimestamp = (await libraryUsageInstance.methods.add_minutes(dt_timestamp, MIN_DIFF)).decodedResult;
      result = (Number(resultTimestamp) - dt_timestamp) / ONE_MINUTE;
  
      assert.equal(result, MIN_DIFF);
    });
  
    it('should substract minutes from given timestamp', async () => {
      date_time = generateRandomDateTime();
      const MIN_DIFF = generateRandomNumber();
  
      dt_timestamp = date_time.getTime() / 1000;
      resultTimestamp = (await libraryUsageInstance.methods.sub_minutes(dt_timestamp, MIN_DIFF)).decodedResult;
      result = (dt_timestamp - Number(resultTimestamp)) / ONE_MINUTE;
  
      assert.equal(result, MIN_DIFF);
    });
  
    it('should add more seconds to current timestamp', async () => {  
      date_time = generateRandomDateTime();
      const SEC_DIFF = generateRandomNumber();
  
      dt_timestamp = date_time.getTime() / 1000;
      resultTimestamp = (await libraryUsageInstance.methods.add_seconds(dt_timestamp, SEC_DIFF)).decodedResult;
      result = Number(resultTimestamp) - dt_timestamp;
  
      assert.equal(result, SEC_DIFF);
    });
  
    it('should substract seconds from given timestamp', async () => {
      date_time = generateRandomDateTime();
      const SEC_DIFF = generateRandomNumber();
  
      dt_timestamp = date_time.getTime() / 1000;
      resultTimestamp = (await libraryUsageInstance.methods.sub_seconds(dt_timestamp, SEC_DIFF)).decodedResult;
      result = dt_timestamp - Number(resultTimestamp);
  
      assert.equal(result, SEC_DIFF);
    });
  
    it('should check difference in years between two timestamps', async () => {
      const futureYear = getRandom(timeUnits.year, 2354, 2020);
      const pastYear = getRandom(timeUnits.year, 2019, 1970);
      future_timestamp = (await libraryUsageInstance.methods.to_timestamp(futureYear, 6, 8, 11, 58, 59)).decodedResult;
      past_timestamp = (await libraryUsageInstance.methods.to_timestamp(pastYear, 6, 8, 11, 58, 59)).decodedResult;
      
      const YEAR_DIFF = futureYear - pastYear;
      result = (await libraryUsageInstance.methods.diff_years(past_timestamp, future_timestamp)).decodedResult;
  
      assert.equal(result, YEAR_DIFF);
    });
  
    it('[NEGATIVE] should revert if method diff_years is called incorrectly', async () => {
      const futureYear = getRandom(timeUnits.year, 2354, 2020);
      const pastYear = getRandom(timeUnits.year, 2019, 1970);
      future_timestamp = (await libraryUsageInstance.methods.to_timestamp(futureYear, 6, 8, 11, 58, 59)).decodedResult;
      past_timestamp = (await libraryUsageInstance.methods.to_timestamp(pastYear, 6, 8, 11, 58, 59)).decodedResult;
  
      await assertNode.rejects(libraryUsageInstance.methods.diff_years(future_timestamp, past_timestamp))
    });
  
    it('should check difference in months between two timestamps', async () => {
      const future_year = getRandom(timeUnits.year, 2354, 2020)
      const random_month_future_year = getRandom(timeUnits.month)
      const past_year = getRandom(timeUnits.year, 2019, 1970)
      const random_month_past_year = getRandom(timeUnits.month)
  
      future_timestamp = (await libraryUsageInstance.methods.to_timestamp(future_year, random_month_future_year, 8, 11, 58, 59)).decodedResult;
      past_timestamp = (await libraryUsageInstance.methods.to_timestamp(past_year, random_month_past_year, 8, 11, 58, 59)).decodedResult;
  
      const MONTH_DIFF = future_year * 12 + random_month_future_year - past_year * 12 - random_month_past_year
      result = (await libraryUsageInstance.methods.diff_months(past_timestamp, future_timestamp)).decodedResult;
  
      assert.equal(result, MONTH_DIFF);
    });
  
    it('[NEGATIVE] should revert if method diff_months is called incorrectly', async () => {
      const future_year = getRandom(timeUnits.year, 2354, 2020);
      const past_year = getRandom(timeUnits.year, 2019, 1970);
  
      await assertNode.rejects(libraryUsageInstance.methods.diff_months(future_year, past_year));
    });
  
    it('should check difference in days between two timestamps', async () => {
      future_timestamp = generateRandomTimeStamp(timePeriod.future);
      past_timestamp = generateRandomTimeStamp(timePeriod.past);
      const DAY_DIFF = Math.floor((future_timestamp - past_timestamp) / ONE_DAY); // ONE_MINUTE / ONE_HOUR / ONE_DAY) //60,60,24
      result = (await libraryUsageInstance.methods.diff_days(past_timestamp, future_timestamp)).decodedResult;
  
      assert.equal(result, DAY_DIFF);
    });
  
    it('[NEGATIVE] should revert if method diff_days is called incorrectly', async () => {
      future_timestamp = generateRandomTimeStamp(timePeriod.future);
      past_timestamp = generateRandomTimeStamp(timePeriod.past);
  
      await assertNode.rejects(libraryUsageInstance.methods.diff_days(future_timestamp, past_timestamp));
    });
  
    it('should check difference in hours between two timestamps', async () => {
      future_timestamp = generateRandomTimeStamp(timePeriod.future);
      past_timestamp = generateRandomTimeStamp(timePeriod.past);
      const HOUR_DIFF = Math.floor((future_timestamp - past_timestamp) / ONE_HOUR);
  
      result = (await libraryUsageInstance.methods.diff_hours(past_timestamp, future_timestamp)).decodedResult;
  
      assert.equal(result, HOUR_DIFF);
    });
  
    it('[NEGATIVE] should revert if method diff_hours is called incorrectly', async () => {
      future_timestamp = generateRandomTimeStamp(timePeriod.future);
      past_timestamp = generateRandomTimeStamp(timePeriod.past);
  
      await assertNode.rejects(libraryUsageInstance.methods.diff_hours(future_timestamp, past_timestamp));
    });
  
    it('should check difference in minutes between two timestamps', async () => {
      future_timestamp = generateRandomTimeStamp(timePeriod.future);
      past_timestamp = generateRandomTimeStamp(timePeriod.past);
      const MIN_DIFF = Math.floor((future_timestamp - past_timestamp) / ONE_MINUTE);
  
      result = (await libraryUsageInstance.methods.diff_minutes(past_timestamp, future_timestamp)).decodedResult;
  
      assert.equal(result, MIN_DIFF);
    });
  
    it('[NEGATIVE] should revert if method diff_minutes is called incorrectly', async () => {
      future_timestamp = generateRandomTimeStamp(timePeriod.future);
      past_timestamp = generateRandomTimeStamp(timePeriod.past);
  
      await assertNode.rejects(libraryUsageInstance.methods.diff_minutes(future_timestamp, past_timestamp));
    });
  
    it('should check difference in seconds between two timestamps', async () => {
      future_timestamp = generateRandomTimeStamp(timePeriod.future);
      past_timestamp = generateRandomTimeStamp(timePeriod.past);
      const SEC_DIFF = future_timestamp - past_timestamp;
  
      result = (await libraryUsageInstance.methods.diff_seconds(past_timestamp, future_timestamp)).decodedResult;
  
      assert.equal(result, SEC_DIFF);
    });
  
    it('[NEGATIVE] should revert if method diff_seconds is called incorrectly', async () => {
      future_timestamp = generateRandomTimeStamp(timePeriod.future);
      past_timestamp = generateRandomTimeStamp(timePeriod.past);
  
      await assertNode.rejects(libraryUsageInstance.methods.diff_seconds(future_timestamp, past_timestamp));
    });
  
    it('should check if date is valid', async () => {
      const validDate = (await libraryUsageInstance.methods.is_valid_date(year, month, day)).decodedResult;
      const invalidYear = (await libraryUsageInstance.methods.is_valid_date(year - 1000, month, day)).decodedResult;
      const invalidMonth = (await libraryUsageInstance.methods.is_valid_date(year, month + 13, day)).decodedResult;
      const invalidDay = (await libraryUsageInstance.methods.is_valid_date(year, month, day + 32)).decodedResult;
  
      assert.equal(validDate, 1);
      assert.equal(invalidYear, 0);
      assert.equal(invalidMonth, 0);
      assert.equal(invalidDay, 0);
    });
  
    it('should check if date time is valid', async () => {
      const validDate = (await libraryUsageInstance.methods.is_valid_date_time(year, month, day, hour, minute, second)).decodedResult;
      const invalidHour = (await libraryUsageInstance.methods.is_valid_date_time(year, month, day, hour + 25, minute, second)).decodedResult;
      const invalidMinute = (await libraryUsageInstance.methods.is_valid_date_time(year, month, day, hour, minute + 61, second)).decodedResult;
      const invalidSecond = (await libraryUsageInstance.methods.is_valid_date_time(year, month, day, hour, minute, second + 61)).decodedResult;
  
      assert.equal(validDate, 1);
      assert.equal(invalidHour, 0);
      assert.equal(invalidMinute, 0);
      assert.equal(invalidSecond, 0);
    });
  
    it('should check if the timestamp is a week day', async () => {
      const valid = (await libraryUsageInstance.methods.is_week_day(479033927)).decodedResult; //Thursday
      const invalid = (await libraryUsageInstance.methods.is_week_day(1559995932)).decodedResult; //Saturday
  
      assert.equal(valid, 1);
      assert.equal(invalid, 0);
    });
  
    it('should check if the timestamp is a weekend', async () => {
      const valid = (await libraryUsageInstance.methods.is_week_end(1559995932)).decodedResult; // Saturday
      const invalid = (await libraryUsageInstance.methods.is_week_end(479033927)).decodedResult; // Thursday
  
      assert.equal(valid, 1);
      assert.equal(invalid, 0);
    });
  });
});
