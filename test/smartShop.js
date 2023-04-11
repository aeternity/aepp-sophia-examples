const { utils } = require('@aeternity/aeproject');

const chai = require('chai');
const assert = chai.assert;

describe('SmartShop', () => {
  const accounts = utils.getDefaultAccounts();
  const ownerAccount = accounts[0]
  const buyerAccount = accounts[1];
  const buyerAddress = buyerAccount.address;
  
  let sellerContractInstance, transportContractInstance, buyerContractInstance;

  before(async () => {
    const aeSdk = await utils.getSdk();
    sellerContractInstance = await aeSdk.initializeContract( { sourceCode: utils.getContractContent('./contracts/SmartShop/Seller.aes') });
    transportContractInstance = await aeSdk.initializeContract( { sourceCode: utils.getContractContent('./contracts/SmartShop/Transport.aes') });
    const BUYER_SOURCE = './contracts/SmartShop/Buyer.aes';
    const buyerContractContent = utils.getContractContent(BUYER_SOURCE);
    const fileSystem = utils.getFilesystem(BUYER_SOURCE);
    buyerContractInstance = await aeSdk.initializeContract({ sourceCode: buyerContractContent, fileSystem });
  });

  describe('Deploy Contracts', () => {
    it('Deploy SellerContract', async () => {
      await sellerContractInstance.init(buyerAddress, 100, { onAccount: ownerAccount });
    });

    it('Deploy TransportContract', async () => {
      await transportContractInstance.init('Lagos', { onAccount: ownerAccount });
    });

    it('Deploying BuyerContract', async () => {
      await buyerContractInstance.init(sellerContractInstance.$options.address, transportContractInstance.$options.address, { onAccount: buyerAccount });
    });
  });

  describe('Interact with contracts', () => {
    it('Should deposit item price to SellerContract from the BuyerContract', async () => {
      await buyerContractInstance.deposit_to_seller_contract({amount: 100});
    });

    it('Should check SellerContract balance from the SellerContract', async () => {
      const result = await sellerContractInstance.seller_contract_balance();
      assert.equal(result.decodedResult, 100);
    });

    it('Should send item from the SellerContract', async () => {
      await sellerContractInstance.send_item();
    });

    it('Should check item status from the SellerContract', async () => {
      const result = await sellerContractInstance.check_item_status();
      assert.equal(result.decodedResult, 'sent_to_transport_courier')
    });

    it('Should change courier location from the TransportContract', async () => {
      await transportContractInstance.change_location('Abuja');
    });

    it('Should check courier status from the TransportContract', async () => {
      const result = await transportContractInstance.check_courier_status();
      assert.equal(result.decodedResult, 'on_way');
    });

    it('Should check courier location from the TransportContract', async () => {
      const result = await transportContractInstance.check_courier_location();
      assert.equal(result.decodedResult, 'Abuja');
    });

    it('Should deliver item from the TransportContract', async () => {
      await transportContractInstance.delivered_item('Jos');
    });

    it('Should check courier location from BuyerContract', async () => {
      const result = await buyerContractInstance.check_courier_location();
      assert.equal(result.decodedResult, 'Jos');
    });

    it('Should check courier status from BuyerContract', async () => {
      const result = await buyerContractInstance.check_courier_status();
      assert.equal(result.decodedResult, 'delivered');
    });

    it('Should recieve item from BuyerContract', async () => {
      await buyerContractInstance.received_item({onAccount: buyerAccount});
    });

    it('Should check SellerContract balance from BuyerContract', async () => {
      const result = await buyerContractInstance.seller_contract_balance();
      assert.equal(result.decodedResult, 0)
    });
  });
});