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

async function callContract (contract, functionName, args, decodeType = 'int') {
  const result = await contract.call(functionName, args)
  const decodedResult = await result.decode(decodeType)
  return decodedResult.value
}

describe('SmartRealEstate Contract', () => {
  let owner
  let SmartRealEstateContract

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
    it('should deploy SmartRealEstate contract', async () => {
      const gas = { gas: config.gas }
      const deployObj = {
        initState: `(1000, "Bohemian apartment", "Varna, 36 Str. Ikonomov")`,
        options: { ttl: config.ttl }
      }
      SmartRealEstateContract = await deployContract(
        'SmartRealEstate',
        owner,
        gas,
        deployObj
      )
      assert(SmartRealEstateContract.hasOwnProperty('address'))
      assert(SmartRealEstateContract.hasOwnProperty('owner'))
    })
  })

  describe('Interact with the contract', () => {
    let ownerAddress

    before(() => {
      ownerAddress = decodeAddress(wallets[0].publicKey)
    })

    it('should delete owner', async () => {
      const args = {
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(
        SmartRealEstateContract,
        'delete_owner',
        args
      )
      assert.equal(result, [])
    })

    it('should create owner', async () => {
      const args = {
        args: `("Villa Maria", 2000, "Sofia, 4 Str. K")`,
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(
        SmartRealEstateContract,
        'add_owner',
        args
      )
      assert.equal(result, [])
    })

    it('should delete property', async () => {
      const args = {
        args: `("Villa Maria")`,
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(
        SmartRealEstateContract,
        'delete_property',
        args
      )
      assert.equal(result, [])
    })

    it('should add property', async () => {
      const args = {
        args: `("Artur apartment", 1000, "Varna, 123 Str. A")`,
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(
        SmartRealEstateContract,
        'add_property',
        args
      )
      assert.equal(result, [])
    })

    it('should get property address', async () => {
      const args = {
        args: `(${ownerAddress}, "Artur apartment")`,
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(
        SmartRealEstateContract,
        'get_property_address',
        args,
        'string'
      )
      assert.equal(result, 'Varna, 123 Str. A')
    })

    it("should get property's paymentstatus", async () => {
      const args = {
        args: `(${ownerAddress}, "Artur apartment")`,
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(
        SmartRealEstateContract,
        'get_payment_status',
        args,
        'bool'
      )
      assert.equal(result, false)
    })

    it("should get property's tenant", async () => {
      const args = {
        args: `(${ownerAddress}, "Artur apartment")`,
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(
        SmartRealEstateContract,
        'get_tenant',
        args,
        'address'
      )
      assert.equal(
        result,
        39519965516565108473327470053407124751867067078530473195651550649472681599133
      )
    })

    it('should get price of the property', async () => {
      const args = {
        args: `(${ownerAddress}, "Artur apartment")`,
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(
        SmartRealEstateContract,
        'get_price',
        args
      )
      assert.equal(result, 1000)
    })

    it('should change the price of the property', async () => {
      const args = {
        args: `("Artur apartment", 3000)`,
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(
        SmartRealEstateContract,
        'change_price',
        args
      )
      assert.equal(result, [])
    })

    it('should get the new price of the property', async () => {
      const args = {
        args: `(${ownerAddress}, "Artur apartment")`,
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(
        SmartRealEstateContract,
        'get_price',
        args
      )
      assert.equal(result, 3000)
    })

    it('should change the address of the property', async () => {
      const args = {
        args: `("Artur apartment", "Sofia, 321 Str. B")`,
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(
        SmartRealEstateContract,
        'change_address',
        args
      )
      assert.equal(result, [])
    })

    it('should get the new address of the property', async () => {
      const args = {
        args: `(${ownerAddress}, "Artur apartment")`,
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(
        SmartRealEstateContract,
        'get_property_address',
        args,
        'string'
      )
      assert.equal(result, 'Sofia, 321 Str. B')
    })

    it('should change the tenant of the property', async () => {
      let newTenantAddress = decodeAddress(wallets[1].publicKey)
      const args = {
        args: `("Artur apartment", ${newTenantAddress})`,
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(
        SmartRealEstateContract,
        'change_tenant',
        args
      )
      assert.equal(result, [])
    })

    it('should get the new tenant of the property', async () => {
      const args = {
        args: `(${ownerAddress}, "Artur apartment")`,
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(
        SmartRealEstateContract,
        'get_tenant',
        args,
        'address'
      )
      assert.equal(
        result,
        52902161269465828228432141313057486257183400825031599431469406173824055923730
      )
    })

    it('should pay the rent', async () => {
      const args = {
        args: `(${ownerAddress}, "Artur apartment")`,
        options: { ttl: 55, amount: 3000 },
        abi: 'sophia'
      }
      const result = await callContract(
        SmartRealEstateContract,
        'pay_rent',
        args
      )
      assert.equal(result, [])
    })

    it("should get property's paymentstatus after it was paid", async () => {
      const args = {
        args: `(${ownerAddress}, "Artur apartment")`,
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(
        SmartRealEstateContract,
        'get_payment_status',
        args,
        'bool'
      )
      assert.equal(result, true)
    })
  })
})
