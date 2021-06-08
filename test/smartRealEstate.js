const chai = require('chai');
const assert = chai.assert;

const { Universal, MemoryAccount, Node } = require('@aeternity/aepp-sdk');

const NETWORKS = require('../config/network.json');
const NETWORK_NAME = "local";

const {defaultWallets: WALLETS} = require('../config/wallets.json');

const contractUtils = require('../utils/contract-utils');

describe('SmartRealEstate Contract', () => {
  let smartRealEstateContractInstance;
  const owner = WALLETS[0];

  before(async () => {
    const node = await Node({ url: NETWORKS[NETWORK_NAME].nodeUrl });
    const client = await Universal({
        nodes: [
          { name: NETWORK_NAME, instance: node },
        ],
        compilerUrl: NETWORKS[NETWORK_NAME].compilerUrl,
        accounts: [MemoryAccount({ keypair: owner })],
        address: owner.publicKey
    });
    const contractContent = contractUtils.getContractContent("./contracts/SmartRealEstate/SmartRealEstate.aes");
    smartRealEstateContractInstance = await client.getContractInstance(contractContent);
  });

  describe('Deploy contract', () => {
    it('should deploy Smart real estate contract', async () => {
      await smartRealEstateContractInstance.deploy([1000, "Bohemian apartment", "Varna, 36 Str. Ikonomov"]);
    });
  });

  describe('Interact with the contract', () => {
    it('should delete owner', async () => {
      await smartRealEstateContractInstance.methods.delete_owner(owner.publicKey);
    });

    it('should create owner', async () => {
      await smartRealEstateContractInstance.methods.add_owner("Villa Maria", 2000, "Sofia, 4 Str. K");
    });

    it('should delete property', async () => {
      await smartRealEstateContractInstance.methods.delete_property("Villa Maria");
    });

    it('should add property', async () => {
      await smartRealEstateContractInstance.methods.add_property("Artur apartment", 1000, "Varna, 123 Str. A");
    });

    it('should get property address', async () => {
      const result = await smartRealEstateContractInstance.methods.get_property_address(owner.publicKey, "Artur apartment");
      assert.equal(result.decodedResult, 'Varna, 123 Str. A');
    });

    it("should get property's paymentstatus", async () => {
      const result = await smartRealEstateContractInstance.methods.get_payment_status(owner.publicKey, "Artur apartment");
      assert.equal(result.decodedResult, false);
    });

    it("should get property's tenant", async () => {
      const result = await smartRealEstateContractInstance.methods.get_tenant(owner.publicKey, "Artur apartment");
      assert.equal(result.decodedResult, owner.publicKey);
    });

    it('should get price of the property', async () => {
      const result = await smartRealEstateContractInstance.methods.get_price(owner.publicKey, "Artur apartment");
      assert.equal(result.decodedResult, 1000);
    });

    it('should change the price of the property', async () => {
      await smartRealEstateContractInstance.methods.change_price("Artur apartment", 3000);
    });

    it('should get the new price of the property', async () => {
      const result = await smartRealEstateContractInstance.methods.get_price(owner.publicKey, "Artur apartment");
      assert.equal(result.decodedResult, 3000);
    });

    it('should change the address of the property', async () => {
      await smartRealEstateContractInstance.methods.change_address("Artur apartment", "Sofia, 321 Str. B");
    });

    it('should get the new address of the property', async () => {
      const result = await smartRealEstateContractInstance.methods.get_property_address(owner.publicKey, "Artur apartment");
      assert.equal(result.decodedResult, 'Sofia, 321 Str. B');
    });

    it('should change the tenant of the property', async () => {
      await smartRealEstateContractInstance.methods.change_tenant("Artur apartment", "ak_gLYH5tAexTCvvQA6NpXksrkPJKCkLnB9MTDFTVCBuHNDJ3uZv");
    });

    it('should get the new tenant of the property', async () => {
      const result = await smartRealEstateContractInstance.methods.get_tenant(owner.publicKey, "Artur apartment");
      assert.equal(result.decodedResult,"ak_gLYH5tAexTCvvQA6NpXksrkPJKCkLnB9MTDFTVCBuHNDJ3uZv");
    });

    it('should pay the rent', async () => {
      await smartRealEstateContractInstance.methods.pay_rent(owner.publicKey, "Artur apartment", {amount: 3000});
    });

    it("should get property's paymentstatus after it was paid", async () => {
      const result = await smartRealEstateContractInstance.methods.get_payment_status(owner.publicKey, "Artur apartment");
      assert.equal(result.decodedResult, true);
    });
  });
});
