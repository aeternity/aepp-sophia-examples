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

function decodeContractAddress (contract) {
  const decoded58addres = Crypto.decodeBase58Check(
    contract.address.split('_')[1]
  ).toString('hex')
  return `0x${decoded58addres}`
}

async function callContract (
  contract,
  functionName,
  args,
  decodeType = 'string'
) {
  const result = await contract.call(functionName, args)
  const decodedResult = await result.decode(decodeType)
  return decodedResult.value
}

describe('Smart Provider Contract', () => {
  let owner
  let BackendContract
  let ClientContract

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

  describe('Deploy contracts', () => {
    it('should deploy SmartDataProviderBackend contract', async () => {
      const gas = { gas: config.gas }
      const deployObj = { options: { ttl: config.ttl } }
      BackendContract = await deployContract(
        'SmartDataProviderBackend',
        owner,
        gas,
        deployObj
      )
      assert(BackendContract.hasOwnProperty('address'))
      assert(BackendContract.hasOwnProperty('owner'))
    })

    it('should deploy SmartDataProviderClient contract', async () => {
      const gas = { gas: config.gas }
      const deployObj = {
        options: { ttl: config.ttl }
      }
      ClientContract = await deployContract(
        'SmartDataProviderClient',
        owner,
        gas,
        deployObj
      )
      assert(ClientContract.hasOwnProperty('address'))
      assert(ClientContract.hasOwnProperty('owner'))
    })
  })

  describe('Interact with contracts', () => {
    let addressBackend
    let addressClient
    before(() => {
      addressBackend = decodeContractAddress(BackendContract)
      addressClient = decodeContractAddress(ClientContract)
    })
    it('should get USD exchange rate', async () => {
      const args = {
        args: `(${addressBackend}, "USD")`,
        options: { ttl: 55, amount: 100 },
        abi: 'sophia'
      }
      const result = await callContract(
        ClientContract,
        'get_exchange_rate',
        args
      )
      assert.equal(result, '1')
    })

    it('should get EUR exchange rate', async () => {
      const args = {
        args: `(${addressBackend}, "EUR")`,
        options: { ttl: 55, amount: 100 },
        abi: 'sophia'
      }
      const result = await callContract(
        ClientContract,
        'get_exchange_rate',
        args
      )
      assert.equal(result, '2')
    })
  })
})
