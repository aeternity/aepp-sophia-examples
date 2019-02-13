const Ae = require('@aeternity/aepp-sdk').Universal

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

async function callContract (contract, functionName, args, decodeType = 'int') {
  const result = await contract.call(functionName, args)
  const decodedResult = await result.decode(decodeType)
  return decodedResult.value
}
function decodeContractAddress (contract) {
  const decoded58addres = Crypto.decodeBase58Check(contract.address.split('_')[1]).toString(
    'hex'
  )
  return `0x${decoded58addres}`
}

describe('SmartBank Contract', () => {
  let owner
  let SmartBankContract

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
    it('should deploy SmartBank contract', async () => {
      const gas = { gas: config.gas }
      const deployObj = {
        options: { ttl: config.ttl }
      }
      SmartBankContract = await deployContract(
        'SmartBank',
        owner,
        gas,
        deployObj
      )
      assert(BaseConverterContract.hasOwnProperty('address'))
      assert(BaseConverterContract.hasOwnProperty('owner'))
    })
  })

  describe('Interact with the contract', () => {

    it('should deposit tokens', async () => {
      const args = {
        args : '"12345"',
        options: { ttl: 55 , amount: 1000},
        abi: 'sophia'
      }
      const result = await callContract(
        SmartBankContract,
        'deposit',
        args,
        'bool'
      )
      assert.equal(result, true)
    })
    it('should check if user is registered in state', async () => {
      const key = decodeContractAddress(ownerKeyPair[0])
      const args = {
        args : key, // pass the address of the caller
        options: {ttl: 55},
        abi: 'sophia'
      }
      const result = await callContract(
        SmartBankContract,
        'user_exists',
        args,
        'bool'
      )
      assert.equal(result, true)
    })


    it('should transfer tokens to its owner (withdrawal)', async () => {
      const args = {
        args: `500`,
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(
        SmartBankContract,
        'transfer',
        args
         // return type?
      )
      assert.equal(result, [])
    })

    it('should check new balance', async () => {
      const args = {
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(
        SmartBankContract,
        'check_balance',
        args,
        'string'
      )
      assert.equal(result, "500")
    })

    it('should transfer tokens', async () => {

      const args = {
        args: `0x0bb4ed7927f97b51e1bcb5e1340d12335b2a2b12c8bc5221d63c4bcb39d41e61, 250, "12345"`,
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(
        SmartRealEstateContract,
        '',
        args)
      assert.equal(result,  [])
    })

    it('should remove an account from the state', async () => {
      const args = {
        args: `"123456"`,
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(
        SmartRealEstateContract,
        'remove_user',
        args
      )
      assert.equal(result, [])
    })
  })
})
