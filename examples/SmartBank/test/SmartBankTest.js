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

async function callContract (contract, functionName, args, decodeType = 'int') {
  const result = await contract.call(functionName, args)
  const decodedResult = await result.decode(decodeType)
  return decodedResult.value
}
function decodeContractAddress (key) {
  const decoded58address = Crypto.decodeBase58Check(key.split('_')[1]).toString(
    'hex'
  )
  return `0x${decoded58address}`
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
      assert(SmartBankContract.hasOwnProperty('address'))
      assert(SmartBankContract.hasOwnProperty('owner'))
    })
  })

  describe('Interact with the contract', () => {

    it('should deposit tokens', async () => {
      const args = {
        args : '("12345")',
        options: { ttl: 55 , amount: 1000},
        abi: 'sophia'
      }
      const result = await callContract(
        SmartBankContract,
        'deposit',
        args,
        '()'
      )
      assert.deepEqual(result, [])

    })
    it('should check if user is registered in state', async () => {
      const key = decodeContractAddress(wallets[0].publicKey)
      const args = {
        args : key, // pass the address of the caller
        options: {ttl: 55},
        abi: 'sophia'
      }
      wallets[0].publicKey
      const result = await callContract(
        SmartBankContract,
        'user_exists',
        args,
        'bool'
      )
      assert.equal(result, '1')
    })


    it('should transfer tokens to its owner (withdrawal)', async () => {
      const args = {
        args: `("12345", 500)`,
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(
        SmartBankContract,
        'withdraw',
        args,
        '()'
         // return type?
      )
      assert.deepEqual(result, [])
    })

    it('should check new balance after withdrawal', async () => {
      const args = {
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(
        SmartBankContract,
        'check_self_balance',
        args,
        )
      assert.equal(result, 500)
    })

    it('should transfer tokens', async () => {
      const key = decodeContractAddress(wallets[0].publicKey)
      const args = {
        args: `(${key}, 250, "12345")`,
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(
        SmartBankContract,
        'transfer',
        args)
      assert.equal(result,  [])
    })

    it('should check new balance after transfer', async () => {
      const args = {
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(
        SmartBankContract,
        'check_self_balance',
        args,
        )
      assert.equal(result, 250)
    })

    it("should remove owner's account from the state", async () => {
      const args = {
        args: `"12345"`,
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(
        SmartBankContract,
        'remove_self',
        args
      )
      assert.equal(result, [])
    })
  })
})
