const Ae = require('@aeternity/aepp-sdk').Universal

const config = {
  host: 'http://localhost:3001/',
  internalHost: 'http://localhost:3001/internal/',
  gas: 200000,
  ttl: 55,
}
let contractSource = utils.readFileRelative('./contracts/DateTime.aes', 'utf-8')
async function deployContract(owner) {
  const compiledContract = await owner.contractCompile(contractSource, {
    gas: config.gas,
  })
  const deployPromise = compiledContract.deploy({
    options: {
      ttl: config.ttl,
    },
  })
  return deployPromise
}

async function callContract(contract, contract_name, timestamp) {
  const result = await contract.call(contract_name, {
    args: `(${timestamp})`,
    options: { ttl: config.ttl },
    abi: 'sophia',
  })
  return result
}

async function processArray(array, function_name) {
  let data = []
  for (const item of array) {
    data.push(await function_name(item, item.timestamp))
  }
  return data.map(el => el.value)
}

describe('Test DateTime', () => {
  let owner = null

  before(async () => {
    const ownerKeyPair = wallets[0]
    owner = await Ae({
      url: config.host,
      internalUrl: config.internalHost,
      keypair: ownerKeyPair,
      nativeMode: true,
      networkId: 'ae_devnet',
    })
  })

  describe('Test convert timestamp', () => {
    it('parse_timestamp function', async () => {
      const year = 2016
      const month = 3
      const day = 7
      const hour = 8
      const minute = 58
      const second = 47
      const weekday = 1
      const timestamp = 1457341127

      const contract = await deployContract(owner)
      const callWithdraw = await callContract(
        contract,
        'parse_timestamp',
        timestamp
      )
      const decodedWithdraw = await callWithdraw
        .decode('(int, int, int, int, int, int, int, int)')
        .then(item => item.value.map(el => el.value))
      assert.deepEqual(decodedWithdraw, [
        year,
        month,
        day,
        hour,
        minute,
        second,
        weekday,
        timestamp,
      ])
    })
  })

  describe('Test all get functions', async () => {
    const year = 1988
    const month = 5
    const day = 5
    const hour = 2
    const minute = 31
    const second = 04
    const timestamp = 578802664
    let contract
    before(async () => {
      contract = await deployContract(owner)
    })

    it('get year', async () => {
      const callWithdrawYear = await callContract(
        contract,
        'get_year',
        timestamp
      ).then(async item => await item.decode('int'))
      assert.equal(callWithdrawYear.value, year)
    })
    it('get month', async () => {
      const callWithdrawMonth = await callContract(
        contract,
        'get_month',
        timestamp
      ).then(async item => await item.decode('int'))
      assert.equal(callWithdrawMonth.value, month)
    })
    it('get day', async () => {
      const callWithdrawDay = await callContract(
        contract,
        'get_day',
        timestamp
      ).then(async item => await item.decode('int'))
      assert.equal(callWithdrawDay.value, day)
    })
    it('get hour', async () => {
      const callWithdrawHour = await callContract(
        contract,
        'get_hour',
        timestamp
      ).then(async item => item.decode('int'))
      assert.equal(callWithdrawHour.value, hour)
    })
    it('get minute', async () => {
      const callWithdrawMinute = await callContract(
        contract,
        'get_minute',
        timestamp
      ).then(async item => item.decode('int'))
      assert.equal(callWithdrawMinute.value, minute)
    })
    it('get second', async () => {
      const callWithdrawSecond = await callContract(
        contract,
        'get_second',
        timestamp
      ).then(async item => item.decode('int'))
      assert.equal(callWithdrawSecond.value, second)
    })
  })

  describe('Test all get functions with multiple data', () => {
    before(async () => {
      contract = await deployContract(owner)
    })

    it('get_year', async () => {
      const array = [
        { year: 1974, timestamp: 126230400 },
        { year: 1982, timestamp: 410227199 },
        { year: 1988, timestamp: 599615999 },
        { year: 2004, timestamp: 1104537599 },
        { year: 2018, timestamp: 1514764800 },
        { year: 2025, timestamp: 1767225599 },
        { year: 2032, timestamp: 1956528000 },
      ]

      async function withdrawYear(item, timestamp) {
        const result = await callContract(contract, 'get_year', timestamp).then(
          async item => item.decode('int')
        )
        return result
      }
      const decodedYears = await processArray(array, withdrawYear)
      const mockupYears = array.map(item => item.year)
      assert.deepEqual(decodedYears, mockupYears)
    })

    it('get_month', async () => {
      const array = [
        { month: 12, timestamp: 63071999 },
        { month: 2, timestamp: 65750400 },
        { month: 7, timestamp: 18316799 },
        { month: 6, timestamp: 13046400 },
        { month: 8, timestamp: 84153599 },
      ]
      async function withdrawMonth(item, timestamp) {
        const result = await callContract(
          contract,
          'get_month',
          timestamp
        ).then(async item => item.decode('int'))
        return result
      }
      const decodedMonths = await processArray(array, withdrawMonth)
      const mockupMonths = array.map(item => item.month)
      assert.deepEqual(decodedMonths, mockupMonths)
    })

    it('get_day', async () => {
      const array = [
        { day: 14, timestamp: 1547476268 },
        { day: 4, timestamp: 1507075200 },
        { day: 7, timestamp: 581644800 },
        { day: 26, timestamp: 1458950400 },
        { day: 30, timestamp: 1209513600 },
      ]
      async function withdrawDay(item, timestamp) {
        const result = await callContract(contract, 'get_day', timestamp).then(
          async item => item.decode('int')
        )
        return result
      }
      const decodedDays = await processArray(array, withdrawDay)
      const mockupDays = array.map(item => item.day)
      assert.deepEqual(decodedDays, mockupDays)
    })

    it('get_hour', async () => {
      const array = [
        { hour: 6, timestamp: 63093600 },
        { hour: 10, timestamp: 63111599 },
        { hour: 17, timestamp: 63136799 },
        { hour: 20, timestamp: 63147599 },
        { hour: 22, timestamp: 63154799 },
      ]
      async function withdrawHour(item, timestamp) {
        const result = await callContract(contract, 'get_hour', timestamp).then(
          async item => item.decode('int')
        )
        return result
      }
      const decodedHours = await processArray(array, withdrawHour)
      const mockupHours = array.map(item => item.hour)

      assert.deepEqual(decodedHours, mockupHours)
    })

    it('get_minute', async () => {
      const array = [
        { minute: 59, timestamp: 63071999 },
        { minute: 4, timestamp: 63072240 },
        { minute: 10, timestamp: 63072600 },
        { minute: 18, timestamp: 63073080 },
        { minute: 25, timestamp: 63073559 },
      ]
      async function withdrawMinute(item, timestamp) {
        const result = await callContract(
          contract,
          'get_minute',
          timestamp
        ).then(async item => item.decode('int'))
        return result
      }
      const decodedMinutes = await processArray(array, withdrawMinute)
      const mockupMinutes = array.map(item => item.minute)

      assert.deepEqual(decodedMinutes, mockupMinutes)
    })

    it('get_second', async () => {
      const array = [
        { second: 59, timestamp: 63071999 },
        { second: 6, timestamp: 63072006 },
        { second: 17, timestamp: 63072017 },
        { second: 23, timestamp: 63072023 },
        { second: 28, timestamp: 63072028 },
      ]
      async function withdrawSecond(item, timestamp) {
        const result = await callContract(
          contract,
          'get_second',
          timestamp
        ).then(async item => item.decode('int'))
        return result
      }
      const decodedSeconds = await processArray(array, withdrawSecond)
      const mockupSeconds = array.map(item => item.second)

      assert.deepEqual(decodedSeconds, mockupSeconds)
    })

    it('get weekday', async () => {
      const array = [
        { weekday: 3, timestamp: 67737599 },
        { weekday: 5, timestamp: 67824000 },
        { weekday: 0, timestamp: 68083199 },
        { weekday: 2, timestamp: 68169600 },
        { weekday: 4, timestamp: 68342400 },
      ]
      async function withdrawWeekday(item, timestamp) {
        const result = await callContract(
          contract,
          'get_weekday',
          timestamp
        ).then(async item => item.decode('int'))
        return result
      }
      const decodedWeekdays = await processArray(array, withdrawWeekday)
      const mockupWeekdays = array.map(item => item.weekday)

      assert.deepEqual(decodedWeekdays, mockupWeekdays)
    })
  })

  describe('Test to timestamp conversion', () => {
    before(async () => {
      contract = await deployContract(owner)
    })
    it('to_timestamp function', async () => {
      const year = 2006
      const month = 7
      const day = 4
      const hour = 9
      const minute = 43
      const second = 7
      const timestamp = 1152006187

      const callWithdraw = await contract
        .call('to_timestamp', {
          args: `(${year}, ${month}, ${day}, ${hour}, ${minute}, ${second})`,
          options: { ttl: config.ttl },
          abi: 'sophia',
        })
        .then(async item => item.decode('int'))
      assert.equal(callWithdraw.value, timestamp)
    })
  })

  describe('Test deploying contract', () => {
    it('deploying DateTime', async () => {
      const compiledContract = await owner.contractCompile(contractSource, {
        gas: config.gas,
      })

      const deployPromise = compiledContract.deploy({
        options: {
          ttl: config.ttl,
        },
      })
      assert.isFulfilled(
        deployPromise,
        'Could not deploy the ExampleContract Smart Contract'
      )
    })
  })
})
