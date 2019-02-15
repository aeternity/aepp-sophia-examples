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

async function callContract (contract, functionName, args, decodeType = 'int') {
  const result = await contract.call(functionName, args)
  const decodedResult = await result.decode(decodeType)
  return decodedResult.value
}

describe('BaseConverter Contract', () => {
  let owner
  let BaseConverterContract

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
    it('should deploy BaseConverter contract', async () => {
      const gas = { gas: config.gas }
      const deployObj = {
        options: { ttl: config.ttl }
      }
      BaseConverterContract = await deployContract(
        'BaseConverter',
        owner,
        gas,
        deployObj
      )
      assert(BaseConverterContract.hasOwnProperty('address'))
      assert(BaseConverterContract.hasOwnProperty('owner'))
    })
  })

  describe('Interact with the contract', () => {
    before(() => {
      addressBaseConverter = decodeContractAddress(BaseConverterContract)
    })

    it('should convert decimal to binary', async () => {
      const args = {
        args: `72`,
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(
        BaseConverterContract,
        'dec_to_binary',
        args,
        'string'
      )
      assert.equal(result, '1001000')
    })

    it('should convert decimal to octal', async () => {
      const args = {
        args: `98`,
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(
        BaseConverterContract,
        'dec_to_oct',
        args,
        'string'
      )
      assert.equal(result, '142')
    })

    it('should convert decimal to hexadecimal', async () => {
      const args = {
        args: `45`,
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(
        BaseConverterContract,
        'dec_to_hex',
        args,
        'string'
      )
      assert.equal(result, '2D')
    })

    it('should convert binary to decimal', async () => {
      const args = {
        args: `1001000`,
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(
        BaseConverterContract,
        'binary_to_dec',
        args,
        'int'
      )
      assert.equal(result, '72')
    })

    it('should convert oct to decimal', async () => {
      const args = {
        args: `142`,
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(
        BaseConverterContract,
        'oct_to_dec',
        args,
        'int'
      )
      assert.equal(result, '98')
    })
  })
})
