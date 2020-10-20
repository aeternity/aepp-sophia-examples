/*
 * ISC License (ISC)
 * Copyright (c) 2018 aeternity developers
 *
 *  Permission to use, copy, modify, and/or distribute this software for any
 *  purpose with or without fee is hereby granted, provided that the above
 *  copyright notice and this permission notice appear in all copies.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 *  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 *  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 *  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 *  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 *  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 *  PERFORMANCE OF THIS SOFTWARE.
 */

const Deployer = require('aeproject-lib').Deployer
const LIBRARY_CONTRACT_PATH = "./contracts/DateTimeLibraryContract.aes"
const DATETIME_CONTRACT_PATH = "./contracts/DateTimeWithLibrary.aes"
const {
  timeUnits,
  timePeriod,
  getRandom,
  generateRandomDateTime,
  generateRandomNumber,
  generateRandomTimeStamp,
  getMonthDifference
} = require('./utils/dateTimeUtils')

describe('DateTime With Library', () => {
  let deployer
  let libraryAddress
  let DateTimeContract
  let ownerKeyPair = wallets[0]

  const ONE_MINUTE = 60
  const ONE_HOUR = 60 * ONE_MINUTE
  const ONE_DAY = 24 * ONE_HOUR

  let randomDate = generateRandomDateTime()
  let year = randomDate.getFullYear()
  let month = randomDate.getMonth() + 1
  let day = randomDate.getDate()
  let hour = randomDate.getHours()
  let minute = randomDate.getMinutes()
  let second = randomDate.getSeconds()
  let weekday = randomDate.getDay()
  let offset = randomDate.getTimezoneOffset()
  let local_diff = (offset * (-1)) * 60
  let starting_timestamp = (randomDate.getTime() / 1000) + local_diff;
  
  let date_time
  let dt_timestamp
  let resultTimestamp
  let result
  let future_timestamp
  let past_timestamp


  before(async () => {
    deployer = new Deployer('local', ownerKeyPair.secretKey)
  })
  
  it('Should deploy the DateTimeLibrary contract', async () => {
    const deployedPromise = deployer.deploy(LIBRARY_CONTRACT_PATH)
    let LibraryContract = await Promise.resolve(deployedPromise)
    libraryAddress = LibraryContract.address

    assert.isFulfilled(deployedPromise, 'Could not deploy the DateTimeLibary Smart Contract')
  })

  it('Should deploy the DateTime contract', async () => {
    const deployedPromise = deployer.deploy(DATETIME_CONTRACT_PATH,[libraryAddress])
    DateTimeContract = await Promise.resolve(deployedPromise)

    assert.isFulfilled(deployedPromise, 'Could not deploy the DateTime Smart Contract')
  })

  it('Should get correct year', async () => {
    result = (await DateTimeContract.get_year(starting_timestamp)).decodedResult
    assert.equal(year, result)
  })

  it('Should get correct month', async () => {
    result = (await DateTimeContract.get_month(starting_timestamp)).decodedResult
    assert.equal(month, result)
  })

  it('Should get correct day', async () => {
    result = (await DateTimeContract.get_day(starting_timestamp)).decodedResult
    assert.equal(day, result)
  })

  it('Should get correct hour', async () => {
    result = (await DateTimeContract.get_hour(starting_timestamp)).decodedResult
    assert.equal(hour, result)
  })

  it('Should get correct minute', async () => {
    result = (await DateTimeContract.get_minute(starting_timestamp)).decodedResult
    assert.equal(minute, result)
  })

  it('Should get correct second', async () => {
    result = (await DateTimeContract.get_second(starting_timestamp)).decodedResult
    assert.equal(second, result)
  })

  it('Should get correct weekday', async () => {
    result = (await DateTimeContract.get_weekday(starting_timestamp)).decodedResult
    assert.equal(weekday, result)
  })

  it('Should convert date to timestamp', async () => {
    result = (await DateTimeContract.to_timestamp(year, month, day, hour, minute, second)).decodedResult

    assert.equal(starting_timestamp, result)
  })

  it('check if the given year is leap', async () => {
    const leap = 2020
    const not_leap = 2019
    const is_leap = (await DateTimeContract.is_leap_year(leap)).decodedResult
    const is_not_leap = (await DateTimeContract.is_leap_year(not_leap)).decodedResult

    assert.equal(1, is_leap)
    assert.equal(0, is_not_leap)
  })

  it('Should add more years to current timestamp', async () => {
    let YEAR_DIFF, result
    let actual_year, expected_year
    
    YEAR_DIFF = generateRandomNumber()
    result = (await DateTimeContract.add_years(starting_timestamp, YEAR_DIFF)).decodedResult
    actual_year = (await DateTimeContract.get_year(result)).decodedResult
    expected_year = year + YEAR_DIFF

    assert.equal(expected_year, actual_year)
  })

  it('Should substract years from current timestamp', async () => {
    let YEAR_DIFF
    let actual_year, expected_year
    
    YEAR_DIFF = generateRandomNumber()
    result = (await DateTimeContract.sub_years(starting_timestamp, YEAR_DIFF)).decodedResult
    actual_year = (await DateTimeContract.get_year(result)).decodedResult
    expected_year = year - YEAR_DIFF
    
    assert.equal(expected_year, actual_year)
  })


  it('Should add more months to current timestamp', async () => {
    let MONTHS_DIFF
    
    date_time = generateRandomDateTime(timePeriod.past);
    MONTHS_DIFF = generateRandomNumber();
    dt_timestamp = date_time.getTime() / 1000

    resultTimestamp = (await DateTimeContract.add_months(dt_timestamp, MONTHS_DIFF)).decodedResult
    result = getMonthDifference(resultTimestamp, dt_timestamp)

    assert.equal(MONTHS_DIFF, result)
  })


  it('Should substract months from current timestamp', async () => {
    let MONTHS_DIFF
    
    date_time = generateRandomDateTime();
    MONTHS_DIFF = generateRandomNumber();
    dt_timestamp = date_time.getTime() / 1000

    resultTimestamp = (await DateTimeContract.sub_months(dt_timestamp, MONTHS_DIFF)).decodedResult
    result = getMonthDifference(dt_timestamp, resultTimestamp)

    assert.equal(MONTHS_DIFF, result)
  })

  it('Should add more days to current timestamp', async () => {
    let DAYS_DIFF

    date_time = generateRandomDateTime()
    dt_timestamp = date_time.getTime() / 1000
        
    DAYS_DIFF = generateRandomNumber();
    resultTimestamp = (await DateTimeContract.add_days(dt_timestamp, DAYS_DIFF)).decodedResult
    result = (resultTimestamp - dt_timestamp) / ONE_DAY

    assert.equal(DAYS_DIFF, result)
  })

  it('Should substract days from timestamp', async () => {
    let DAYS_DIFF

    date_time = generateRandomDateTime()
    dt_timestamp = date_time.getTime() / 1000

    DAYS_DIFF = generateRandomNumber();
    resultTimestamp = (await DateTimeContract.sub_days(dt_timestamp, DAYS_DIFF)).decodedResult
    result = (dt_timestamp - resultTimestamp) / ONE_DAY

    assert.equal(DAYS_DIFF, result)
  })

  it('Should add hours to given timestamp', async () => {
    let HOUR_DIFF
   
    date_time = generateRandomDateTime();
    HOUR_DIFF= generateRandomNumber();

    dt_timestamp = date_time.getTime() / 1000
    resultTimestamp = (await DateTimeContract.add_hours(dt_timestamp, HOUR_DIFF)).decodedResult
    result = (resultTimestamp - dt_timestamp) / ONE_HOUR

    assert.equal(HOUR_DIFF, result)
  })

  it('Should substract hours from given timestamp', async () => {
    let HOUR_DIFF
    
    date_time = generateRandomDateTime();
    HOUR_DIFF = generateRandomNumber();

    dt_timestamp = date_time.getTime() / 1000
    resultTimestamp = (await DateTimeContract.sub_hours(dt_timestamp, HOUR_DIFF)).decodedResult
    result = (dt_timestamp -resultTimestamp) / ONE_HOUR

    assert.equal(HOUR_DIFF, result)
  })

  it('Should add more minutes to current timestamp', async () => {
    let MIN_DIFF
    
    date_time = generateRandomDateTime();
    MIN_DIFF = generateRandomNumber();

    dt_timestamp = date_time.getTime() / 1000
    resultTimestamp = (await DateTimeContract.add_minutes(dt_timestamp, MIN_DIFF)).decodedResult
    result = (resultTimestamp - dt_timestamp) / ONE_MINUTE
    
    assert.equal(MIN_DIFF, result)
  })

  it('Should substract minutes from given timestamp', async () => {
    let MIN_DIFF
    
    date_time = generateRandomDateTime();
    MIN_DIFF = generateRandomNumber();

    dt_timestamp = date_time.getTime() / 1000
    resultTimestamp = (await DateTimeContract.sub_minutes(dt_timestamp, MIN_DIFF)).decodedResult
    result = (dt_timestamp - resultTimestamp) / ONE_MINUTE
    
    assert.equal(MIN_DIFF, result)
  })

  it('Should add more seconds to current timestamp', async () => {
    let SEC_DIFF
    
    date_time = generateRandomDateTime();
    SEC_DIFF = generateRandomNumber();

    dt_timestamp = date_time.getTime() / 1000
    resultTimestamp = (await DateTimeContract.add_seconds(dt_timestamp, SEC_DIFF)).decodedResult
    result = resultTimestamp - dt_timestamp

    assert.equal(SEC_DIFF, result)
  })

  it('Should substract seconds from given timestamp', async () => {
    let SEC_DIFF
    
    date_time = generateRandomDateTime();
    SEC_DIFF = generateRandomNumber();

    dt_timestamp = date_time.getTime() / 1000
    resultTimestamp = (await DateTimeContract.sub_seconds(dt_timestamp, SEC_DIFF)).decodedResult
    result = dt_timestamp - resultTimestamp 

    assert.equal(SEC_DIFF, result)
  })

  it('Should check difference in years between two timestamps', async () => {
    let futureYear, pastYear
    let YEAR_DIFF, result
    
    futureYear = getRandom(timeUnits.year, 2354, 2020)
    pastYear = getRandom(timeUnits.year, 2019, 1970)
    future_timestamp = (await DateTimeContract.to_timestamp(futureYear, 6, 8, 11, 58, 59)).decodedResult
    past_timestamp = (await DateTimeContract.to_timestamp(pastYear, 6, 8, 11, 58, 59)).decodedResult
    YEAR_DIFF = futureYear - pastYear

    result = (await DateTimeContract.diff_years(past_timestamp, future_timestamp)).decodedResult

    assert.equal(YEAR_DIFF, result)
  })

  it('[NEGATIVE] Should revert if method diff_years is called incorrectly', async () => {
    let futureYear, pastYear
    
    futureYear = getRandom(timeUnits.year, 2354, 2020)
    pastYear = getRandom(timeUnits.year, 2019, 1970)
    future_timestamp = (await DateTimeContract.to_timestamp(futureYear, 6, 8, 11, 58, 59)).decodedResult
    past_timestamp = (await DateTimeContract.to_timestamp(pastYear, 6, 8, 11, 58, 59)).decodedResult

    await assert.isRejected(DateTimeContract.diff_years(future_timestamp, past_timestamp))
  })

  it('Should check difference in months between two timestamps', async () => {
    let future_year, random_month_future_year;
    let past_year, random_month_past_year;
    let MONTH_DIFF
    
    future_year = getRandom(timeUnits.year, 2354, 2020)
    random_month_future_year = getRandom(timeUnits.month)
    past_year = getRandom(timeUnits.year, 2019, 1970)
    random_month_past_year = getRandom(timeUnits.month)

    future_timestamp = (await DateTimeContract.to_timestamp(future_year, random_month_future_year, 8, 11, 58, 59)).decodedResult
    past_timestamp = (await DateTimeContract.to_timestamp(past_year, random_month_past_year, 8, 11, 58, 59)).decodedResult
  
    MONTH_DIFF = future_year * 12 + random_month_future_year - past_year * 12 - random_month_past_year
    result = (await DateTimeContract.diff_months(past_timestamp, future_timestamp)).decodedResult
    
    assert.equal(MONTH_DIFF, result)
  })

  it('[NEGATIVE] Should revert if method diff_months is called incorrectly', async () => {
    let future_year = getRandom(timeUnits.year, 2354, 2020)
    let past_year = getRandom(timeUnits.year, 2019, 1970)

    await assert.isRejected(DateTimeContract.diff_months(future_year, past_year))
  })

  it('Should check difference in days between two timestamps', async () => {
    let DAY_DIFF

    future_timestamp = generateRandomTimeStamp(timePeriod.future)
    past_timestamp = generateRandomTimeStamp(timePeriod.past)
    DAY_DIFF = Math.floor((future_timestamp - past_timestamp) / ONE_DAY) // ONE_MINUTE / ONE_HOUR / ONE_DAY) //60,60,24
    result = (await DateTimeContract.diff_days(past_timestamp, future_timestamp)).decodedResult
  
    assert.equal(DAY_DIFF, result)
  })

  it('[NEGATIVE] Should revert if method diff_days is called incorrectly', async () => {
    future_timestamp = generateRandomTimeStamp(timePeriod.future)
    past_timestamp = generateRandomTimeStamp(timePeriod.past)

    await assert.isRejected(DateTimeContract.diff_days(future_timestamp, past_timestamp))
  })

  it('Should check difference in hours between two timestamps', async () => {
    let HOUR_DIFF, result
    
    future_timestamp = generateRandomTimeStamp(timePeriod.future)
    past_timestamp = generateRandomTimeStamp(timePeriod.past)
    HOUR_DIFF = Math.floor((future_timestamp - past_timestamp) / ONE_HOUR)

    result = (await DateTimeContract.diff_hours(past_timestamp, future_timestamp)).decodedResult

    assert.equal(HOUR_DIFF, result)
  })

  it('[NEGATIVE] Should revert if method diff_hours is called incorrectly', async () => {
    future_timestamp = generateRandomTimeStamp(timePeriod.future)
    past_timestamp = generateRandomTimeStamp(timePeriod.past)

    await assert.isRejected(DateTimeContract.diff_hours(future_timestamp, past_timestamp))
  })

  it('Should check difference in minutes between two timestamps', async () => {
    let MIN_DIFF
    
    future_timestamp = generateRandomTimeStamp(timePeriod.future)
    past_timestamp = generateRandomTimeStamp(timePeriod.past)
    MIN_DIFF = Math.floor((future_timestamp - past_timestamp) / ONE_MINUTE)

    result = (await DateTimeContract.diff_minutes(past_timestamp, future_timestamp)).decodedResult

    assert.equal(MIN_DIFF, result)
  })

  it('[NEGATIVE] Should revert if method diff_minutes is called incorrectly', async () => {
    future_timestamp = generateRandomTimeStamp(timePeriod.future)
    past_timestamp = generateRandomTimeStamp(timePeriod.past)

    await assert.isRejected(DateTimeContract.diff_minutes(future_timestamp, past_timestamp))
  })

  it('Should check difference in seconds between two timestamps', async () => {
    let SEC_DIFF
    
    future_timestamp = generateRandomTimeStamp(timePeriod.future)
    past_timestamp = generateRandomTimeStamp(timePeriod.past)
    SEC_DIFF = future_timestamp - past_timestamp

    result = (await DateTimeContract.diff_seconds(past_timestamp, future_timestamp)).decodedResult

    assert.equal(SEC_DIFF, result)
  })

  it('[NEGATIVE] Should revert if method diff_seconds is called incorrectly', async () => {
    future_timestamp = generateRandomTimeStamp(timePeriod.future)
    past_timestamp = generateRandomTimeStamp(timePeriod.past)

    await assert.isRejected(DateTimeContract.diff_seconds(future_timestamp, past_timestamp))
  })

  it('Should check if date is valid', async () => {
    let validDate
    let invalidYear, invalidMonth, invalidDay

    validDate = (await DateTimeContract.is_valid_date(year, month, day)).decodedResult
    invalidYear = (await DateTimeContract.is_valid_date(year - 1000, month, day)).decodedResult
    invalidMonth = (await DateTimeContract.is_valid_date(year, month + 13, day)).decodedResult
    invalidDay = (await DateTimeContract.is_valid_date(year, month, day + 32)).decodedResult

    assert.equal(1, validDate)
    assert.equal(0, invalidYear)
    assert.equal(0, invalidMonth)
    assert.equal(0, invalidDay)
  })

  it('Should check if date time is valid', async () => {
    let validDate
    let invalidHour, invalidMinute, invalidSecond

    validDate = (await DateTimeContract.is_valid_date_time(year, month, day, hour, minute, second)).decodedResult
    invalidHour = (await DateTimeContract.is_valid_date_time(year, month, day, hour + 25, minute, second)).decodedResult
    invalidMinute = (await DateTimeContract.is_valid_date_time(year, month, day, hour, minute + 61, second)).decodedResult
    invalidSecond = (await DateTimeContract.is_valid_date_time(year, month, day, hour, minute, second + 61)).decodedResult

    assert.equal(1, validDate)
    assert.equal(0, invalidHour)
    assert.equal(0, invalidMinute)
    assert.equal(0, invalidSecond)
  })

  it('Should check if the timestamp is a week day', async () => {
    let valid = (await DateTimeContract.is_week_day(479033927)).decodedResult //Thursday
    let invalid = (await DateTimeContract.is_week_day(1559995932)).decodedResult //Saturday

    assert.equal(1, valid)
    assert.equal(0, invalid)
  })

  it('Should check if the timestamp is a weekend', async () => {
    let valid = (await DateTimeContract.is_week_end(1559995932)).decodedResult // Saturday
    let invalid = (await DateTimeContract.is_week_end(479033927)).decodedResult // Thursday

    assert.equal(1, valid)
    assert.equal(0, invalid)
  })
})