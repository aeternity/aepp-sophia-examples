const path = require('path');
const chai = require('chai');
let chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const assert = chai.assert;

const AeSDK = require('@aeternity/aepp-sdk');
const Crypto = require('@aeternity/aepp-sdk').Crypto;
const Universal = AeSDK.Universal;
const config = require("./constants/config.json")
const utils = require('./utils/utils');
const getClient = utils.getClient;

const SMART_REAL_ESTATE_CONTRACT_FILE_PATH = "./../contracts/smart-real-estate.aes";

const smartRealEstateContractSource = utils.readFileRelative(`./contracts/${SMART_REAL_ESTATE_CONTRACT_FILE_PATH}`, 'utf-8')

describe('SmartRealEstate Contract', () => {

  let client, smartRealEstateContractInstance;

  beforeEach(async () => {
      client = await getClient(Universal, config, config.ownerKeyPair);
  });

  describe('Deploy contracts', () => {

    it('should deploy Smart real estate contract', async () => {
      smartRealEstateContractInstance = await client.getContractInstance(smartRealEstateContractSource);
      const init = await smartRealEstateContractInstance.deploy([1000, "Bohemian apartment", "Varna, 36 Str. Ikonomov"]);
      assert.equal(init.result.returnType, 'ok');
    })
  })

  describe('Interact with the contract', () => {
    
    let ownerAddress = config.ownerKeyPair.publicKey

    it('should delete owner', async () => {
      const result = await smartRealEstateContractInstance.methods.delete_owner(ownerAddress)
      assert.equal(result.decodedResult.length, 0)
    })

    it('should create owner', async () => {
      const result = await smartRealEstateContractInstance.methods.add_owner("Villa Maria", 2000, "Sofia, 4 Str. K")
      assert.equal(result.decodedResult.length, 0)
    })

    it('should delete property', async () => {
      const result = await smartRealEstateContractInstance.methods.delete_property("Villa Maria")
      assert.equal(result.decodedResult.length, 0)
    })

    it('should add property', async () => {
      const result = await smartRealEstateContractInstance.methods.add_property("Artur apartment", 1000, "Varna, 123 Str. A")
      assert.equal(result.decodedResult.length, 0)
    })

    it('should get property address', async () => {
      const result = await smartRealEstateContractInstance.methods.get_property_address(ownerAddress, "Artur apartment")
      assert.equal(result.decodedResult, 'Varna, 123 Str. A')
    })

    it("should get property's paymentstatus", async () => {
      const result = await smartRealEstateContractInstance.methods.get_payment_status(ownerAddress, "Artur apartment")
      assert.equal(result.decodedResult, false)
    })

    it("should get property's tenant", async () => {
      const result = await smartRealEstateContractInstance.methods.get_tenant(ownerAddress, "Artur apartment")
      assert.equal(result.decodedResult,"ak_2mwRmUeYmfuW93ti9HMSUJzCk1EYcQEfikVSzgo6k2VghsWhgU")
    })

    it('should get price of the property', async () => {
      const result = await smartRealEstateContractInstance.methods.get_price(ownerAddress, "Artur apartment")
      assert.equal(result.decodedResult, 1000)
    })

    it('should change the price of the property', async () => {
      const result = await smartRealEstateContractInstance.methods.change_price("Artur apartment", 3000)
      assert.equal(result.decodedResult.length, 0)
    })

    it('should get the new price of the property', async () => {
      const result = await smartRealEstateContractInstance.methods.get_price(ownerAddress, "Artur apartment")
      assert.equal(result.decodedResult, 3000)
    })

    it('should change the address of the property', async () => {
      const result = await smartRealEstateContractInstance.methods.change_address("Artur apartment", "Sofia, 321 Str. B")
      assert.equal(result.decodedResult.length, 0)
    })

    it('should get the new address of the property', async () => {
      const result = await smartRealEstateContractInstance.methods.get_property_address(ownerAddress, "Artur apartment")
      assert.equal(result.decodedResult, 'Sofia, 321 Str. B')
    })

    it('should change the tenant of the property', async () => {
      let newTenantAddress = "ak_gLYH5tAexTCvvQA6NpXksrkPJKCkLnB9MTDFTVCBuHNDJ3uZv"
      const result = await smartRealEstateContractInstance.methods.change_tenant("Artur apartment", newTenantAddress)
      assert.equal(result.decodedResult.length, 0)
    })

    it('should get the new tenant of the property', async () => {
      const result = await smartRealEstateContractInstance.methods.get_tenant(ownerAddress, "Artur apartment")
      assert.equal(result.decodedResult,"ak_gLYH5tAexTCvvQA6NpXksrkPJKCkLnB9MTDFTVCBuHNDJ3uZv")
    })

    it('should pay the rent', async () => {
      const result = await smartRealEstateContractInstance.methods.pay_rent(ownerAddress, "Artur apartment", {amount: 3000})
      assert.equal(result.decodedResult.length, 0)
    })

    it("should get property's paymentstatus after it was paid", async () => {
      const result = await smartRealEstateContractInstance.methods.get_payment_status(ownerAddress, "Artur apartment")
      assert.equal(result.decodedResult, true)
    })
  })
})
