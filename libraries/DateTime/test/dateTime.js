const Ae = require('@aeternity/aepp-sdk').Universal

const config = {
  host: 'http://localhost:3001/',
  internalHost: 'http://localhost:3001/internal/',
  gas: 200000,
  ttl: 55
}
let contractSource = utils.readFileRelative('./contracts/DateTime.aes', 'utf-8')

async function callContract (contract, function_name, timestamp) {
  const result = await contract.call(function_name, {
    args: `(${timestamp})`,
    options: { ttl: config.ttl },
    abi: 'sophia'
  })
  return result
}

async function processArray (array, function_name) {
  let data = []
  for (const item of array) {
    data.push(await function_name(item, item.timestamp))
  }
  return data.map(el => el.value)
}

describe('DateTime', () => {
  let owner = null
  let deployedContract
  let compiledContract

  before(async () => {
    const ownerKeyPair = wallets[0]
    owner = await Ae({
      url: config.host,
      internalUrl: config.internalHost,
      keypair: ownerKeyPair,
      nativeMode: true,
      networkId: 'ae_devnet'
    })

    compiledContract = await owner.contractCompile(contractSource, {})
    deployedContract = compiledContract.deploy({
      options: {
        ttl: config.ttl
      },
      abi: 'sophia'
    })
    assert.isFulfilled(
      deployedContract,
      'Could not deploy the ExampleContract Smart Contract'
    )
    deployedContract = await deployedContract
  })

  describe('Interaction with contract', () => {
    describe('Convert timestamp', () => {
      it('should convert timestamp to record', async () => {
        const year = 2016
        const month = 3
        const day = 7
        const hour = 8
        const minute = 58
        const second = 47
        const weekday = 1
        const timestamp = 1457341127

        const callWithdraw = await callContract(
          deployedContract,
          'parse_timestamp',
          timestamp
        )

        const result = await callWithdraw.decode(
          '(int, int, int, int, int, int, int, int, int, int)'
        )
        const decodedWithdraw = result.value.map(item => item.value)
        assert.deepEqual(decodedWithdraw.slice(0, -2), [
          year,
          month,
          day,
          hour,
          minute,
          second,
          weekday,
          timestamp
        ])
      })
    })

    describe('Get functions', async () => {
      let date = new Date(1988, 5, 5, 2, 31, 4)
      let timestamp = date.getTime()

      const year = date.getUTCFullYear()
      const month = date.getUTCMonth() + 1
      const day = date.getUTCDate()
      const hour = date.getUTCHours()
      const minute = date.getUTCMinutes()
      const second = date.getUTCSeconds()
      timestamp = parseInt(timestamp / 1000)

      it('should get year', async () => {
        const result = await callContract(
          deployedContract,
          'get_year',
          timestamp
        )
        const callWithdrawYear = await result.decode('int')

        assert.equal(callWithdrawYear.value, year)
      })
      it('should get month', async () => {
        const result = await callContract(
          deployedContract,
          'get_month',
          timestamp
        )
        const callWithdrawMonth = await result.decode('int')

        assert.equal(callWithdrawMonth.value, month)
      })
      it('should get day', async () => {
        const result = await callContract(
          deployedContract,
          'get_day',
          timestamp
        )

        const callWithdrawDay = await result.decode('int')

        assert.equal(callWithdrawDay.value, day)
      })
      it('should get hour', async () => {
        const result = await callContract(
          deployedContract,
          'get_hour',
          timestamp
        )
        const callWithdrawHour = await result.decode('int')

        assert.equal(callWithdrawHour.value, hour)
      })
      it('should get minute', async () => {
        const result = await callContract(
          deployedContract,
          'get_minute',
          timestamp
        )

        const callWithdrawMinute = await result.decode('int')

        assert.equal(callWithdrawMinute.value, minute)
      })
      it('should get second', async () => {
        const result = await callContract(
          deployedContract,
          'get_second',
          timestamp
        )
        const callWithdrawSecond = await result.decode('int')

        assert.equal(callWithdrawSecond.value, second)
      })
    })

    describe('Get functions with multiple data', () => {
      const array = [
        {
          year: 1974,
          month: 1,
          day: 1,
          hour: 22,
          minute: 45,
          second: 35,
          weekday: 2,
          timestamp: 126312335
        },
        {
          year: 1982,
          month: 3,
          day: 22,
          hour: 5,
          minute: 56,
          second: 44,
          weekday: 1,
          timestamp: 385624604
        },
        {
          year: 1988,
          month: 3,
          day: 6,
          hour: 9,
          minute: 10,
          second: 6,
          weekday: 0,
          timestamp: 573642606
        },
        {
          year: 2004,
          month: 7,
          day: 14,
          hour: 10,
          minute: 33,
          second: 45,
          weekday: 3,
          timestamp: 1089801225
        },
        {
          year: 2018,
          month: 11,
          day: 24,
          hour: 7,
          minute: 5,
          second: 4,
          weekday: 6,
          timestamp: 1543043104
        },
        {
          year: 2025,
          month: 12,
          day: 18,
          hour: 0,
          minute: 50,
          second: 34,
          weekday: 4,
          timestamp: 1766019034
        },
        {
          year: 2032,
          month: 6,
          day: 30,
          hour: 14,
          minute: 29,
          second: 59,
          weekday: 3,
          timestamp: 1972218599
        }
      ]

      it('should get year', async () => {
        async function withdrawYear (item, timestamp) {
          const result = await callContract(
            deployedContract,
            'get_year',
            timestamp
          )
          const decoded = await result.decode('int')
          return decoded
        }
        const decodedYears = await processArray(array, withdrawYear)
        const mockupYears = array.map(item => item.year)
        assert.deepEqual(decodedYears, mockupYears)
      })

      it('should get month', async () => {
        async function withdrawMonth (item, timestamp) {
          const result = await callContract(
            deployedContract,
            'get_month',
            timestamp
          )
          const decoded = await result.decode('int')
          return decoded
        }
        const decodedMonths = await processArray(array, withdrawMonth)
        const mockupMonths = array.map(item => item.month)
        assert.deepEqual(decodedMonths, mockupMonths)
      })

      it('should get day', async () => {
        async function withdrawDay (item, timestamp) {
          const result = await callContract(
            deployedContract,
            'get_day',
            timestamp
          )
          const decoded = await result.decode('int')
          return decoded
        }
        const decodedDays = await processArray(array, withdrawDay)
        const mockupDays = array.map(item => item.day)
        assert.deepEqual(decodedDays, mockupDays)
      })

      it('should get hour', async () => {
        async function withdrawHour (item, timestamp) {
          const result = await callContract(
            deployedContract,
            'get_hour',
            timestamp
          )
          const decoded = await result.decode('int')
          return decoded
        }
        const decodedHours = await processArray(array, withdrawHour)
        const mockupHours = array.map(item => item.hour)

        assert.deepEqual(decodedHours, mockupHours)
      })

      it('should get minute', async () => {
        async function withdrawMinute (item, timestamp) {
          const result = await callContract(
            deployedContract,
            'get_minute',
            timestamp
          )
          const decoded = await result.decode('int')
          return decoded
        }
        const decodedMinutes = await processArray(array, withdrawMinute)
        const mockupMinutes = array.map(item => item.minute)

        assert.deepEqual(decodedMinutes, mockupMinutes)
      })

      it('should get second', async () => {
        async function withdrawSecond (item, timestamp) {
          const result = await callContract(
            deployedContract,
            'get_second',
            timestamp
          )
          const decoded = await result.decode('int')
          return decoded
        }
        const decodedSeconds = await processArray(array, withdrawSecond)
        const mockupSeconds = array.map(item => item.second)

        assert.deepEqual(decodedSeconds, mockupSeconds)
      })

      it('should get weekday', async () => {
        async function withdrawWeekday (item, timestamp) {
          const result = await callContract(
            deployedContract,
            'get_weekday',
            timestamp
          )
          const decoded = await result.decode('int')
          return decoded
        }
        const decodedWeekdays = await processArray(array, withdrawWeekday)
        const mockupWeekdays = array.map(item => item.weekday)

        assert.deepEqual(decodedWeekdays, mockupWeekdays)
      })
    })

    describe('To timestamp conversion', () => {
      it('should convert hardcoded date to_timestamp', async () => {
        const year = 2006
        const month = 7
        const day = 4
        const hour = 9
        const minute = 43
        const second = 7
        const timestamp = 1152006187

        const result = await deployedContract.call('to_timestamp', {
          args: `(${year}, ${month}, ${day}, ${hour}, ${minute}, ${second})`,
          options: { ttl: config.ttl },
          abi: 'sophia'
        })

        const decoded = await result.decode('int')
        assert.equal(decoded.value, timestamp)
      })

      it('should convert date to_timestamp', async () => {
        let date = new Date(2016, 1, 29, 10, 45, 32)
        let timestamp = date.getTime()
        const year = date.getUTCFullYear()
        const month = date.getUTCMonth() + 1
        const day = date.getUTCDate()
        const hour = date.getUTCHours()
        const minute = date.getUTCMinutes()
        const second = date.getUTCSeconds()

        timestamp = parseInt(timestamp / 1000)

        const result = await deployedContract.call('to_timestamp', {
          args: `(${year}, ${month}, ${day}, ${hour}, ${minute}, ${second})`,
          options: { ttl: config.ttl },
          abi: 'sophia'
        })

        const decoded = await result.decode('int')
        assert.equal(decoded.value, timestamp)
      })
    })
  })
})
