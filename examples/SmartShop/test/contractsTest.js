const path = require('path');
const chai = require('chai');
let chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const assert = chai.assert;

const AeSDK = require('@aeternity/aepp-sdk');
const Universal = AeSDK.Universal;
const config = require("./constants/config.json")
const utils = require('./utils/utils');
const getClient = utils.getClient;

const BUYER_CONTRACT_FILE_PATH = "./../contracts/buyer-contract.aes";
const SELLER_CONTRACT_FILE_PATH = "./../contracts/seller-contract.aes";
const TRANSPORT_CONTRACT_FILE_PATH = "./../contracts/transport-contract.aes";

const buyerContractSource = utils.readFileRelative(`./contracts/${BUYER_CONTRACT_FILE_PATH}`, 'utf-8')
const sellerContractSource = utils.readFileRelative(`./contracts/${SELLER_CONTRACT_FILE_PATH}`, 'utf-8')
const transportContractSource = utils.readFileRelative(`./contracts/${TRANSPORT_CONTRACT_FILE_PATH}`, 'utf-8')


describe('Contracts', () => {
  
  let client, buyerContractInstance, sellerContractInstance, transportContractInstance;

  beforeEach(async () => {
      client = await getClient(Universal, config, config.ownerKeyPair);
  });


  describe('Deploy contracts', () => {

    it('should deploy Buyer contract', async () => {
      buyerContractInstance = await client.getContractInstance(buyerContractSource);
      const init = await buyerContractInstance.deploy([]);
      assert.equal(init.result.returnType, 'ok');
    })

    it('should deploy Seller contract', async () => {
        sellerContractInstance = await client.getContractInstance(sellerContractSource);
        const init = await sellerContractInstance.deploy([config.ownerKeyPair.publicKey, 100]);
        assert.equal(init.result.returnType, 'ok');
    })
    
    it('should deploy Transport contract', async () => {
      transportContractInstance = await client.getContractInstance(transportContractSource);
      const init = await transportContractInstance.deploy([1548074338, "Varna"]);
      assert.equal(init.result.returnType, 'ok');
    })

  })

  describe('Interact with contracts', () => {
  //   let addressSeller
  //   let addressTransport
  //   before (() => {
  //     addressSeller = decodeContractAddress(SellerContract)
  //     addressTransport = decodeContractAddress(TransportContract)
  //   })
  //   it("should deposit tokens to seller's contract", async () => {
  //     const args = {
  //       args: `(2000, ${addressSeller})`,
  //       options: { ttl: 55, amount: 2000 },
  //       abi: 'sophia'
  //     }
  //     const result = await callContract(BuyerContract, 'deposit_to_seller_contract', args)
  //     assert.equal(result, [])
  //   })

  //   it("should check seller's contract balance", async () => {
  //     const args = {
  //       options: { ttl: 55 },
  //       abi: 'sophia'
  //     }
  //     const result = await callContract(SellerContract, 'seller_contract_balance', args)
  //     assert.equal(result, 2000)
  //   })

  //   it('should send item', async () => {
  //     const args = {
  //       options: { ttl: 55 },
  //       abi: 'sophia'
  //     }
  //     const result = await callContract(SellerContract, 'send_item', args)
  //     assert.equal(result, [])
  //   })

  //   it('should check item status', async () => {
  //     const args = {
  //       options: { ttl: 55 },
  //       abi: 'sophia'
  //     }
  //     const result = await callContract(SellerContract, 'check_item_status', args, 'string')
  //     assert.equal(result, 'sent_to_transport_courier')
  //   })

  //   it('should change location', async () => {
  //     const args = {
  //       args: `(1548157482, "Burgas")`,
  //       options: { ttl: 55 },
  //       abi: 'sophia'
  //     }
  //     const result = await callContract(TransportContract, 'change_location', args, 'bool')
  //     assert.equal(result, [])
  //   })

  //   it('should check courier status', async () => {
  //     const args = {
  //       options: { ttl: 55 },
  //       abi: 'sophia'
  //     }
  //     const result = await callContract(TransportContract, 'check_courier_status', args, 'string')
  //     assert.equal(result, 'on_way')
  //   })

  //   it('should check courier location', async () => {
  //     const args = {
  //       options: { ttl: 55 },
  //       abi: 'sophia'
  //     }
  //     const result = await callContract(TransportContract, 'check_courier_location', args, 'string')
  //     assert.equal(result, 'Burgas')
  //   })

  //   it('should check courier timestamp', async () => {
  //     const args = {
  //       options: { ttl: 55 },
  //       abi: 'sophia'
  //     }
  //     const result = await callContract(TransportContract, 'check_courier_timestamp', args)
  //     assert.equal(result, 1548157482)
  //   })

  //   it('should deliver item', async () => {
  //     const args = {
  //       args: `(1548157980, "Sofia")`,
  //       options: { ttl: 55 },
  //       abi: 'sophia'
  //     }
  //     const result = await callContract(TransportContract, 'delivered_item', args, 'bool')
  //     assert.equal(result, [])
  //   })

  //   it('should check courier location from Buyer contract', async () => {
  //     const args = {
  //       args: `${addressTransport}`,
  //       options: { ttl: 55 },
  //       abi: 'sophia'
  //     }
  //     const result = await callContract(BuyerContract, 'check_courier_location', args, 'string')
  //     assert.equal(result, 'Sofia')
  //   })

  //   it('should check courier status from Buyer contract', async () => {
  //     const args = {
  //       args: `${addressTransport}`,
  //       options: { ttl: 55 },
  //       abi: 'sophia'
  //     }
  //     const result = await callContract(BuyerContract, 'check_courier_status', args, 'string')
  //     assert.equal(result, 'delivered')
  //   })

  //   it('should check courier timestamp from Buyer contract', async () => {
  //     const args = {
  //       args: `${addressTransport}`,
  //       options: { ttl: 55 },
  //       abi: 'sophia'
  //     }
  //     const result = await callContract(BuyerContract, 'check_courier_timestamp', args)
  //     assert.equal(result, 1548157980)
  //   })

  //   it('should recieve item from Buyer contract', async () => {
  //     const args = {
  //       args: `(${addressSeller})`,
  //       options: { ttl: 55 },
  //       abi: 'sophia'
  //     }
  //     const result = await callContract(BuyerContract, 'received_item', args, 'bool')
  //     assert.equal(result, true)
  //   })
    
  //   it('should check seller ballance', async () => {
  //     const args = {
  //       options: { ttl: 55 },
  //       abi: 'sophia'
  //     }
  //     const result = await callContract(SellerContract, 'seller_contract_balance', args)
  //     assert.equal(result, 0)
  //   })
  })
})