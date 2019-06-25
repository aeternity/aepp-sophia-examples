const Deployer = require('forgae-lib').Deployer
const someContract = "./contracts/DateTimeLibrary.aes"


describe('DateTime Library', () => {
  let deployedContract
  let deployer

  let year = 2012
  let month = 6
  let day = 8
  let hour = 11
  let minute = 58
  let second = 59
  const starting_timestamp = 1339156739 //2012-06-08T11:58:59

  before(async () => {
    const ownerKeyPair = wallets[0]

    deployer = new Deployer('local', ownerKeyPair.secretKey)
    deployedContract = deployer.deploy(someContract)

    assert.isFulfilled(deployedContract, 'Could not deploy the ExampleContract Smart Contract')
    deployedContract = await deployedContract
  })

  it('should get correct year', async () => {
    let expected_year = 2012
    let result = await deployedContract.get_year(starting_timestamp)
    
    assert.equal(expected_year, result)
  })

  it('should get correct month', async () => {
    let expected_month = 6
    let result = await deployedContract.get_month(starting_timestamp)

    assert.equal(expected_month, result)
  })

  it('should get correct day', async () => {
    let expected_day = 8
    let result = await deployedContract.get_day(starting_timestamp)

    assert.equal(expected_day, result)
  })

  it('should get correct hour', async () => {
    let expected_hour = 11
    let result = await deployedContract.get_hour(starting_timestamp)

    assert.equal(expected_hour, result)
  })

  it('should get correct minute', async () => {
    let expected_minute = 58
    let result = await deployedContract.get_minute(starting_timestamp)

    assert.equal(expected_minute, result)
  })

  it('should get correct second', async () => {
    let expected_second = 59
    let result = await deployedContract.get_second(starting_timestamp)

    assert.equal(expected_second, result)
  })

  it('should get correct weekday', async () => {
    let expected_weekday = 5
    let result = await deployedContract.get_weekday(starting_timestamp)

    assert.equal(expected_weekday, result)
  })

  it('should convert date to timestamp', async () => {
    const result = await deployedContract.to_timestamp(year, month, day, hour, minute, second)

    assert.equal(starting_timestamp, result)
  })

  it('check if the given year is leap', async () => {
    const leap = 2020
    const not_leap = 2019
    const is_leap = await deployedContract.is_leap_year(leap)
    const is_not_leap = await deployedContract.is_leap_year(not_leap)

    assert.equal(1, is_leap)
    assert.equal(0, is_not_leap)
  })

  it('should add more years to current timestamp', async () => {
    let added_years = 20
    let result = await deployedContract.add_years(starting_timestamp, 20)
    let actual_year = await deployedContract.get_year(result)
    let expected_year = year + added_years

    assert.equal(expected_year, actual_year)
  })

  it('should substract years from current timestamp', async () => {
    let year = 1992

    let timestamp_to_match = await deployedContract.to_timestamp(year, month, day, hour, minute, second) //1992-06-08T11:58:59
    let result = await deployedContract.sub_years(starting_timestamp, 20)

    assert.equal(timestamp_to_match, result)
  })

  it('should add more months to current timestamp', async () => {
    let year = 2342

    let result = await deployedContract.add_months(starting_timestamp, 3960)
    let timestamp_to_match = await deployedContract.to_timestamp(year, month, day, hour, minute, second)

    assert.equal(timestamp_to_match, result)
  })

  it('should substract months from current timestamp', async () => {
    let year = 2007

    let timestamp_to_match = await deployedContract.to_timestamp(year, month, day, hour, minute, second)
    let result = await deployedContract.sub_months(starting_timestamp, 60)

    assert.equal(timestamp_to_match, result)
  })

  it('should add more days to current timestamp', async () => {
    let year = 2025
    const DAY_DIFF = 4748

    let timestamp_to_match = await deployedContract.to_timestamp(year, month, day, hour, minute, second)
    let result = await deployedContract.add_days(starting_timestamp, DAY_DIFF)

    assert.equal(timestamp_to_match, result)

  })

  it('should substract days from timestamp', async () => {
    let year = 1985
    const DAY_DIFF = 9862

    let timestamp_to_match = await deployedContract.to_timestamp(year, month, day, hour, minute, second)
    let result = await deployedContract.sub_days(starting_timestamp, DAY_DIFF)

    assert.equal(timestamp_to_match, result)
  })

  it('should add hours to given timestamp', async () => {
    let year = 2354
    const HOUR_DIFF = 2997888

    let timestamp_to_match = await deployedContract.to_timestamp(year, month, day, hour, minute, second)
    let result = await deployedContract.add_hours(starting_timestamp, HOUR_DIFF)

    assert.equal(timestamp_to_match, result)
  })

  it('should substract hours from given timestamp', async () => {
    let year = 1985
    const HOUR_DIFF = 236688

    let timestamp_to_match = await deployedContract.to_timestamp(year, month, day, hour, minute, second)
    let result = await deployedContract.sub_hours(starting_timestamp, HOUR_DIFF)

    assert.equal(timestamp_to_match, result)
  })

  it('should add more minutes to current timestamp', async () => {
    let year = 2021
    const MIN_DIFF = 4733280

    let timestamp_to_match = await deployedContract.to_timestamp(year, month, day, hour, minute, second)
    let result = await deployedContract.add_minutes(starting_timestamp, MIN_DIFF)

    assert.equal(timestamp_to_match, result)
  })

  it('should substract minutes from given timestamp', async () => {
    let year = 1985
    const MIN_DIFF = 14201280

    let timestamp_to_match = await deployedContract.to_timestamp(year, month, day, hour, minute, second)
    let result = await deployedContract.sub_minutes(starting_timestamp, MIN_DIFF)

    assert.equal(timestamp_to_match, result)
  })

  it('should add more seconds to current timestamp', async () => {
    let year = 2021
    const SEC_DIFF = 283996800

    let timestamp_to_match = await deployedContract.to_timestamp(year, month, day, hour, minute, second)
    let result = await deployedContract.add_seconds(starting_timestamp, SEC_DIFF)

    assert.equal(timestamp_to_match, result)
  })

  it('should substract seconds from given timestamp', async () => {
    let year = 1985
    const SEC_DIFF = 852076800

    let timestamp_to_match = await deployedContract.to_timestamp(year, month, day, hour, minute, second)
    let result = await deployedContract.sub_seconds(starting_timestamp, SEC_DIFF)

    assert.equal(timestamp_to_match, result)
  })

  it('should check difference in years between two timestamps', async () => {
    let timestamp_2016 = await deployedContract.to_timestamp(2012, 6, 8, 11, 58, 59)
    let timestamp_1985 = await deployedContract.to_timestamp(1985, 6, 8, 11, 58, 59)
    let YEAR_DIFF = 27

    let result = await deployedContract.diff_years(timestamp_1985, timestamp_2016)

    assert.equal(YEAR_DIFF, result)
  })

  it('[NEGATIVE] should revert if method diff_years is called incorrectly', async () => {
    let timestamp_2016 = await deployedContract.to_timestamp(2012, 6, 8, 11, 58, 59)
    let timestamp_1985 = await deployedContract.to_timestamp(1985, 6, 8, 11, 58, 59)

    await assert.isRejected(deployedContract.diff_years(timestamp_2016, timestamp_1985))
  })

  it('should check difference in months between two timestamps', async () => {
    let timestamp_2016 = await deployedContract.to_timestamp(2012, 6, 8, 11, 58, 59)
    let timestamp_1985 = await deployedContract.to_timestamp(1985, 6, 8, 11, 58, 59)
    let MONTH_DIFF = 324

    let result = await deployedContract.diff_months(timestamp_1985, timestamp_2016)

    assert.equal(MONTH_DIFF, result)
  })

  it('[NEGATIVE] should revert if method diff_months is called incorrectly', async () => {
    let timestamp_2016 = await deployedContract.to_timestamp(2012, 6, 8, 11, 58, 59)
    let timestamp_1985 = await deployedContract.to_timestamp(1985, 6, 8, 11, 58, 59)

    await assert.isRejected(deployedContract.diff_months(timestamp_2016, timestamp_1985))
  })

  it('should check difference in days between two timestamps', async () => {
    let timestamp_2016 = await deployedContract.to_timestamp(2012, 6, 8, 11, 58, 59)
    let timestamp_1985 = await deployedContract.to_timestamp(1985, 6, 8, 11, 58, 59)
    let DAY_DIFF = 9862

    let result = await deployedContract.diff_days(timestamp_1985, timestamp_2016)

    assert.equal(DAY_DIFF, result)
  })

  it('[NEGATIVE] should revert if method diff_days is called incorrectly', async () => {
    let timestamp_2016 = await deployedContract.to_timestamp(2012, 6, 8, 11, 58, 59)
    let timestamp_1985 = await deployedContract.to_timestamp(1985, 6, 8, 11, 58, 59)

    await assert.isRejected(deployedContract.diff_days(timestamp_2016, timestamp_1985))
  })

  it('should check difference in hours between two timestamps', async () => {
    let timestamp_2016 = await deployedContract.to_timestamp(2012, 6, 8, 11, 58, 59)
    let timestamp_1985 = await deployedContract.to_timestamp(1985, 6, 8, 11, 58, 59)
    let HOUR_DIFF = 236688

    let result = await deployedContract.diff_hours(timestamp_1985, timestamp_2016)

    assert.equal(HOUR_DIFF, result)
  })

  it('[NEGATIVE] should revert if method diff_hours is called incorrectly', async () => {
    let timestamp_2016 = await deployedContract.to_timestamp(2012, 6, 8, 11, 58, 59)
    let timestamp_1985 = await deployedContract.to_timestamp(1985, 6, 8, 11, 58, 59)

    await assert.isRejected(deployedContract.diff_hours(timestamp_2016, timestamp_1985))
  })

  it('should check difference in minutes between two timestamps', async () => {
    let timestamp_2016 = await deployedContract.to_timestamp(2012, 6, 8, 11, 58, 59)
    let timestamp_1985 = await deployedContract.to_timestamp(1985, 6, 8, 11, 58, 59)
    let MIN_DIFF = 14201280

    let result = await deployedContract.diff_minutes(timestamp_1985, timestamp_2016)

    assert.equal(MIN_DIFF, result)
  })

  it('[NEGATIVE] should revert if method diff_minutes is called incorrectly', async () => {
    let timestamp_2016 = await deployedContract.to_timestamp(2012, 6, 8, 11, 58, 59)
    let timestamp_1985 = await deployedContract.to_timestamp(1985, 6, 8, 11, 58, 59)

    await assert.isRejected(deployedContract.diff_minutes(timestamp_2016, timestamp_1985))
  })

  it('should check difference in seconds between two timestamps', async () => {
    let timestamp_2016 = await deployedContract.to_timestamp(2012, 6, 8, 11, 58, 59)
    let timestamp_1985 = await deployedContract.to_timestamp(1985, 6, 8, 11, 58, 59)
    let SEC_DIFF = 852076800

    let result = await deployedContract.diff_seconds(timestamp_1985, timestamp_2016)

    assert.equal(SEC_DIFF, result)
  })

  it('[NEGATIVE] should revert if method diff_seconds is called incorrectly', async () => {
    let timestamp_2016 = await deployedContract.to_timestamp(2012, 6, 8, 11, 58, 59)
    let timestamp_1985 = await deployedContract.to_timestamp(1985, 6, 8, 11, 58, 59)

    await assert.isRejected(deployedContract.diff_seconds(timestamp_2016, timestamp_1985))
  })

  it('should check if date is valid', async () => {
    let valid = await deployedContract.is_valid_date(1985, 6, 7)
    let invalid = await deployedContract.is_valid_date(1969, 14, 32)

    assert.equal(1, valid)
    assert.equal(0, invalid)
  })

  it('should check if date time is valid', async () => {
    let valid = await deployedContract.is_valid_date_time(1985, 6, 7, 9, 44, 44)
    let invalid = await deployedContract.is_valid_date_time(1985, 6, 7, 73, 44, 44)

    assert.equal(1, valid)
    assert.equal(0, invalid)
  })

  it('should check if the timestamp is a week day', async () => {
    let valid = await deployedContract.is_week_day(479033927) //Thursday
    let invalid = await deployedContract.is_week_day(1559995932) //Saturday

    assert.equal(1, valid)
    assert.equal(0, invalid)
  })

  it('should check if the timestamp is a weekend', async () => {
    let valid = await deployedContract.is_week_end(1559995932) // Saturday
    let invalid = await deployedContract.is_week_end(479033927) // Thursday

    assert.equal(1, valid)
    assert.equal(0, invalid)
  })
})