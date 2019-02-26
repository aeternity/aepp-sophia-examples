const Ae = require('@aeternity/aepp-sdk').Universal
const Crypto = require('@aeternity/aepp-sdk').Crypto

const config = {
  host: 'http://localhost:3001/',
  internalHost: 'http://localhost:3001/internal/',
  gas: 200000,
  ttl: 55
}

async function deployContract (contractName, ...params) {
  const [owner, gas, deployObj] = [params[0], params[1], params[2]]
  const contractSource = utils.readFileRelative(
    `./contracts/${contractName}.aes`,
    'utf-8'
  )
  const compileContract = await owner.contractCompile(contractSource, gas)
  const deployPromiseContract = await compileContract.deploy(deployObj)
  return deployPromiseContract
}

function decodeAddress (key) {
  const decoded58addres = Crypto.decodeBase58Check(key.split('_')[1]).toString(
    'hex'
  )
  return `0x${decoded58addres}`
}

async function callContract(
  contract,
  functionName,
  args,
  decodeType = 'string'
) {
  const result = await contract.call(functionName, args)
  const decodedResult = await result.decode(decodeType)
  return decodedResult.value
}

describe('SpendToMany Contract', () => {
  let owner
  let SpendToMany

  before(async () => {
    const ownerKeyPair = wallets[0]
    owner = await Ae({
      url: config.host,
      internalUrl: config.internalHost,
      keypair: ownerKeyPair,
      nativeMode: true,
      networkId: 'ae_devnet'
    })
  })

  describe('Deploy contract', () => {
    it('should deploy SpendToMany contract', async () => {
      const gas = { gas: config.gas }
      const deployObj = { options: { ttl: config.ttl } }
      SpendToMany = await deployContract('SpendToMany', owner, gas, deployObj)
      assert(SpendToMany.hasOwnProperty('address'))
      assert(SpendToMany.hasOwnProperty('owner'))
    })
  })

  describe('Interact with the contract', async () => {
    let sophiaMap = ''
    let genRandomTokensAmount
    let totalTokens = 0

    for (let i = 0; i < wallets.length; i++) {
      if (i + 1 == wallets.length) {
        genRandomTokensAmount = Math.floor(Math.random() * 1000) + 1
        totalTokens = totalTokens + genRandomTokensAmount
        sophiaMap =
          sophiaMap +
          `[${decodeAddress(wallets[i].publicKey)}] =  ${genRandomTokensAmount}`
      } else {
        genRandomTokensAmount = Math.floor(Math.random() * 1000) + 1
        totalTokens = totalTokens + genRandomTokensAmount
        sophiaMap =
          sophiaMap +
          `[${decodeAddress(
            wallets[i].publicKey
          )}] =  ${genRandomTokensAmount}, `
      }
    }

    it('should spend to multiple addresses with valid amount', async () => {
      const args = {
        args: `{${sophiaMap}}`,
        options: { ttl: 55, amount: 10000 },
        abi: 'sophia'
      }

      const result = await callContract(
        SpendToMany,
        'spend_to_many',
        args,
        'int'
      )
      assert.equal(result, totalTokens)
    })

    it('should spend and check balance again', async () => {
      let current_balance = await owner.balance(`${wallets[1].publicKey}`)

      const args_ = {
        args: `{[${decodeAddress(wallets[1].publicKey)}] = 200}`,
        options: { ttl: 55, amount: 10000 },
        abi: 'sophia'
      }
      await callContract(SpendToMany, 'spend_to_many', args_, 'int')

      let balance_after_spend = await owner.balance(`${wallets[1].publicKey}`)

      assert.equal(balance_after_spend, parseInt(current_balance, 10) + 200)
    })

    it('should spend to 0 addresses', async () => {
      const args = {
        args: `{}`,
        options: { ttl: 55, amount: 10000 },
        abi: 'sophia'
      }

      const result = await callContract(
        SpendToMany,
        'spend_to_many',
        args,
        'int'
      )
      assert.equal(result, 0)
    })

    it('should spend to multiple addresses with invalid amount', async () => {
      const args = {
        args: `{${sophiaMap}}`,
        options: { ttl: 55, amount: 1 },
        abi: 'sophia'
      }

      const result = callContract(SpendToMany, 'spend_to_many', args, 'int')
      await assert.isRejected(result)
    })
  })
})
