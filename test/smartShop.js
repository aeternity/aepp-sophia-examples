const { utils, wallets } = require('@aeternity/aeproject');

const chai = require('chai');
const assert = chai.assert;

describe('SmartShop', () => {
  let owner = wallets[0], buyer = wallets[1];
  let sellerContractInstance, transportContractInstance, buyerContractInstance;

  before(async () => {
    const aeSdk = await utils.getSdk();
    sellerContractInstance = await aeSdk.getContractInstance( { source: utils.getContractContent('./contracts/SmartShop/Seller.aes') });
    transportContractInstance = await aeSdk.getContractInstance( { source: utils.getContractContent('./contracts/SmartShop/Transport.aes') });
    const BUYER_SOURCE = './contracts/SmartShop/Buyer.aes';
    const buyerContractContent = utils.getContractContent(BUYER_SOURCE);
    const filesystem = utils.getFilesystem(BUYER_SOURCE);
    buyerContractInstance = await aeSdk.getContractInstance({ source: buyerContractContent, filesystem });
  });

  describe('Deploy Contracts', () => {
    it('Deploy SellerContract', async () => {
      await sellerContractInstance.deploy([buyer.publicKey, 100], { onAccount: owner });
    });

    it('Deploy TransportContract', async () => {
      await transportContractInstance.deploy(['Lagos'], { onAccount: owner });
    });

    it('Deploying BuyerContract', async () => {
      await buyerContractInstance.deploy([sellerContractInstance.deployInfo.address, transportContractInstance.deployInfo.address], { onAccount: buyer });
    });
  });

  describe('Interact with contracts', () => {
    it('Should deposit item price to SellerContract from the BuyerContract', async () => {
      await buyerContractInstance.methods.deposit_to_seller_contract({amount: 100});
    });

    it('Should check SellerContract balance from the SellerContract', async () => {
      const result = await sellerContractInstance.methods.seller_contract_balance();
      assert.equal(result.decodedResult, 100);
    });

    it('Should send item from the SellerContract', async () => {
      await sellerContractInstance.methods.send_item();
    });

    it('Should check item status from the SellerContract', async () => {
      const result = await sellerContractInstance.methods.check_item_status();
      assert.equal(result.decodedResult, 'sent_to_transport_courier')
    });

    it('Should change courier location from the TransportContract', async () => {
      await transportContractInstance.methods.change_location('Abuja');
    });

    it('Should check courier status from the TransportContract', async () => {
      const result = await transportContractInstance.methods.check_courier_status();
      assert.equal(result.decodedResult, 'on_way');
    });

    it('Should check courier location from the TransportContract', async () => {
      const result = await transportContractInstance.methods.check_courier_location();
      assert.equal(result.decodedResult, 'Abuja');
    });

    it('Should deliver item from the TransportContract', async () => {
      await transportContractInstance.methods.delivered_item('Jos');
    });

    it('Should check courier location from BuyerContract', async () => {
      const result = await buyerContractInstance.methods.check_courier_location();
      assert.equal(result.decodedResult, 'Jos');
    });

    it('Should check courier status from BuyerContract', async () => {
      const result = await buyerContractInstance.methods.check_courier_status();
      assert.equal(result.decodedResult, 'delivered');
    });

    it('Should recieve item from BuyerContract', async () => {
      await buyerContractInstance.methods.received_item({onAccount: buyer});
    });

    it('Should check SellerContract balance from BuyerContract', async () => {
      const result = await buyerContractInstance.methods.seller_contract_balance();
      assert.equal(result.decodedResult, 0)
    });
  });
});