const { utils } = require('@aeternity/aeproject');

const chai = require('chai');
const assert = chai.assert;

describe('SmartRealEstate Contract', async () => {
  const accounts = utils.getDefaultAccounts();
  const ownerAccount = accounts[0];
  const ownerAddress = await ownerAccount.address();

  let smartRealEstateContractInstance;

  before(async () => {
    const aeSdk = await utils.getSdk();
    const contractContent = utils.getContractContent("./contracts/SmartRealEstate/SmartRealEstate.aes");
    smartRealEstateContractInstance = await aeSdk.getContractInstance({ source: contractContent });
  });

  describe('Deploy contract', () => {
    it('should deploy Smart real estate contract', async () => {
      await smartRealEstateContractInstance.deploy([1000, "Bohemian apartment", "Varna, 36 Str. Ikonomov"]);
    });
  });

  describe('Interact with the contract', () => {
    it('should delete owner', async () => {
      await smartRealEstateContractInstance.methods.delete_owner( { onAccount: ownerAccount } );
    });

    it('should create owner', async () => {
      await smartRealEstateContractInstance.methods.add_owner("Villa Maria", 2000, "Sofia, 4 Str. K", { onAccount: ownerAccount });
    });

    it('should delete property', async () => {
      await smartRealEstateContractInstance.methods.delete_property("Villa Maria", { onAccount: ownerAccount });
    });

    it('should add property', async () => {
      await smartRealEstateContractInstance.methods.add_property("Artur apartment", 1000, "Varna, 123 Str. A", { onAccount: ownerAccount });
    });

    it('should get property address', async () => {
      const result = await smartRealEstateContractInstance.methods.get_property_address(ownerAddress, "Artur apartment", { onAccount: ownerAccount });
      assert.equal(result.decodedResult, 'Varna, 123 Str. A');
    });

    it("should get property's paymentstatus", async () => {
      const result = await smartRealEstateContractInstance.methods.get_payment_status(ownerAddress, "Artur apartment", { onAccount: ownerAccount });
      assert.equal(result.decodedResult, false);
    });

    it("should get property's tenant", async () => {
      const result = await smartRealEstateContractInstance.methods.get_tenant(ownerAddress, "Artur apartment", { onAccount: ownerAccount });
      assert.equal(result.decodedResult, ownerAddress);
    });

    it('should get price of the property', async () => {
      const result = await smartRealEstateContractInstance.methods.get_price(ownerAddress, "Artur apartment", { onAccount: ownerAccount });
      assert.equal(result.decodedResult, 1000);
    });

    it('should change the price of the property', async () => {
      await smartRealEstateContractInstance.methods.change_price("Artur apartment", 3000, { onAccount: ownerAccount });
    });

    it('should get the new price of the property', async () => {
      const result = await smartRealEstateContractInstance.methods.get_price(ownerAddress, "Artur apartment", { onAccount: ownerAccount });
      assert.equal(result.decodedResult, 3000);
    });

    it('should change the address of the property', async () => {
      await smartRealEstateContractInstance.methods.change_address("Artur apartment", "Sofia, 321 Str. B", { onAccount: ownerAccount });
    });

    it('should get the new address of the property', async () => {
      const result = await smartRealEstateContractInstance.methods.get_property_address(ownerAddress, "Artur apartment", { onAccount: ownerAccount });
      assert.equal(result.decodedResult, 'Sofia, 321 Str. B');
    });

    it('should change the tenant of the property', async () => {
      await smartRealEstateContractInstance.methods.change_tenant("Artur apartment", "ak_gLYH5tAexTCvvQA6NpXksrkPJKCkLnB9MTDFTVCBuHNDJ3uZv", { onAccount: ownerAccount });
    });

    it('should get the new tenant of the property', async () => {
      const result = await smartRealEstateContractInstance.methods.get_tenant(ownerAddress, "Artur apartment", { onAccount: ownerAccount });
      assert.equal(result.decodedResult,"ak_gLYH5tAexTCvvQA6NpXksrkPJKCkLnB9MTDFTVCBuHNDJ3uZv");
    });

    it('should pay the rent', async () => {
      await smartRealEstateContractInstance.methods.pay_rent(ownerAddress, "Artur apartment", { onAccount: ownerAccount, amount: 3000 });
    });

    it("should get property's paymentstatus after it was paid", async () => {
      const result = await smartRealEstateContractInstance.methods.get_payment_status(ownerAddress, "Artur apartment", { onAccount: ownerAccount });
      assert.equal(result.decodedResult, true);
    });
  });
});
