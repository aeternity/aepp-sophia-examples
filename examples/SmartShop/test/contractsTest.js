const Ae = require('@aeternity/aepp-sdk').Universal
const Crypto = require('@aeternity/aepp-sdk').Crypto

const config = {
  host: 'http://localhost:3001/',
  internalHost: 'http://localhost:3001/internal/',
  gas: 200000,
  ttl: 55
}
async function deployContract (contractName, ...params) {
  const [owner, gas, deployObj] = [params[0],params[1],params[2]]
  const contractSource = utils.readFileRelative(`./contracts/${contractName}.aes`, 'utf-8')
  const compileContract = await owner.contractCompile(contractSource, gas)
  const deployPromiseContract = await compileContract.deploy(deployObj)
  return deployPromiseContract
}

function decodeContractAddress (contract) {
  const decoded58addres = Crypto.decodeBase58Check(contract.address.split('_')[1]).toString(
    'hex'
  )
  return `0x${decoded58addres}`
}

async function callContract (contract, functionName, args, decodeType = 'int') {
  const result = await contract.call(functionName, args)
  const decodedResult = await result.decode(decodeType)
  return decodedResult.value
}


describe('Contracts', () => {
  let owner
  let BuyerContract
  let SellerContract
  let TransportContract
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
    it('should deploy Buyer contract', async () => {
      const gas = {gas: config.gas}
      const deployObj = {options: { ttl: config.ttl }}
      BuyerContract = await deployContract('BuyerContract', owner, gas, deployObj)
      assert(BuyerContract.hasOwnProperty('address'))
      assert(BuyerContract.hasOwnProperty('owner')) 
    })

    it('should deploy Seller contract', async () => {
      const addressBuyer = decodeContractAddress(BuyerContract)
      const gas = {gas: config.gas}
      const deployObj = {
        initState: `(${addressBuyer}, 2000)`,
        options: { ttl: config.ttl }
      }
      SellerContract = await deployContract('SellerContract', owner, gas, deployObj)
      assert(SellerContract.hasOwnProperty('address'))
      assert(SellerContract.hasOwnProperty('owner')) 
    })
    
    it('should deploy Transport contract', async () => {
      const gas = {gas: config.gas}
      const deployObj = {
        initState: `(1548074338, "Varna")`,
        options: { ttl: config.ttl }
      }
      TransportContract = await deployContract('TransportContract', owner, gas, deployObj)
      assert(TransportContract.hasOwnProperty('address'))
      assert(TransportContract.hasOwnProperty('owner')) 
    })
  })

  describe('Interact with contracts', () => {
    let addressSeller
    let addressTransport
    before (() => {
      addressSeller = decodeContractAddress(SellerContract)
      addressTransport = decodeContractAddress(TransportContract)
    })
    it("should deposit tokens to seller's contract", async () => {
      const args = {
        args: `(2000, ${addressSeller})`,
        options: { ttl: 55, amount: 2000 },
        abi: 'sophia'
      }
      const result = await callContract(BuyerContract, 'deposit_to_seller_contract', args)
      assert.equal(result, true)
    })

    it("should check seller's contract balance", async () => {
      const args = {
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(SellerContract, 'seller_contract_balance', args)
      assert.equal(result, 2002)
    })

    it('should send item', async () => {
      const args = {
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(SellerContract, 'send_item', args)
      assert.equal(result, true)
    })

    it('should check item status', async () => {
      const args = {
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(SellerContract, 'check_item_status', args, 'string')
      assert.equal(result, 'sent_to_transport_courier')
    })

    it('should change location', async () => {
      const args = {
        args: `(1548157482, "Burgas")`,
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(TransportContract, 'change_location', args, 'bool')
      assert.equal(result, true)
    })

    it('should check courier status', async () => {
      const args = {
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(TransportContract, 'check_courier_status', args, 'string')
      assert.equal(result, 'on_way')
    })

    it('should check courier location', async () => {
      const args = {
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(TransportContract, 'check_courier_location', args, 'string')
      assert.equal(result, 'Burgas')
    })

    it('should check courier timestamp', async () => {
      const args = {
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(TransportContract, 'check_courier_timestamp', args)
      assert.equal(result, 1548157482)
    })

    it('should deliver item', async () => {
      const args = {
        args: `(1548157980, "Sofia")`,
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(TransportContract, 'delivered_item', args, 'bool')
      assert.equal(result, true)
    })

    it('should check courier location from Buyer contract', async () => {
      const args = {
        args: `${addressTransport}`,
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(BuyerContract, 'check_courier_location', args, 'string')
      assert.equal(result, 'Sofia')
    })

    it('should check courier status from Buyer contract', async () => {
      const args = {
        args: `${addressTransport}`,
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(BuyerContract, 'check_courier_status', args, 'string')
      assert.equal(result, 'delivered')
    })

    it('should check courier timestamp from Buyer contract', async () => {
      const args = {
        args: `${addressTransport}`,
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(BuyerContract, 'check_courier_timestamp', args)
      assert.equal(result, 1548157980)
    })

    it('should recieve item from Buyer contract', async () => {
      const args = {
        args: `(${addressSeller})`,
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(BuyerContract, 'received_item', args, 'bool')
      assert.equal(result, true)
    })
    
    it('should check seller ballance', async () => {
      const args = {
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(SellerContract, 'seller_contract_balance', args)
      assert.equal(result, 5)
    })
  })
})