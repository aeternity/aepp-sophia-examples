/*
 * ISC License (ISC)
 * Copyright (c) 2018 aeternity developers
 *
 *  Permission to use, copy, modify, and/or distribute this software for any
 *  purpose with or without fee is hereby granted, provided that the above
 *  copyright notice and this permission notice appear in all copies.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 *  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 *  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 *  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 *  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 *  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 *  PERFORMANCE OF THIS SOFTWARE.
 */

const Deployer = require('aeproject-lib').Deployer;
const BUYER_CONTRACT_PATH = "./contracts/BuyerContract.aes";
const SELLER_CONTRACT_PATH = "./contracts/SellerContract.aes";
const TRANSPORT_CONTRACT_PATH = "./contracts/TransportContract.aes";

describe('SmartShop Contract', () => {

  let deployer, buyerDeployer;
  let ownerKeyPair = wallets[0], buyerKeyPair = wallets[1];

  before(async () => {
    deployer = new Deployer('local', ownerKeyPair.secretKey)
    buyerDeployer = new Deployer('local', buyerKeyPair.secretKey)
  })

  describe('Deploy Contracts', () => {
    let addressSeller, addressTransport;

    it('Deploying SellerContract', async () => {
      const sellerDeployedPromise = deployer.deploy(SELLER_CONTRACT_PATH, [buyerKeyPair.publicKey, 100]) // Deploy it
      addressSeller = (await Promise.resolve(sellerDeployedPromise)).address // Get contract Address

      await assert.isFulfilled(sellerDeployedPromise, 'Could not deploy the SellerContract'); // Check whether it's deployed
    })

    it('Deploying TransportContract', async () => {
      const transportDeployedPromise = deployer.deploy(TRANSPORT_CONTRACT_PATH, ["Lagos"]) // Deploy it
      addressTransport = (await Promise.resolve(transportDeployedPromise)).address // Get contract Address

      await assert.isFulfilled(transportDeployedPromise, 'Could not deploy the TransportContract'); // Check whether it's deployed
    })

    it('Deploying BuyerContract', async () => {
      const buyerDeployedPromise = buyerDeployer.deploy(BUYER_CONTRACT_PATH, [addressSeller, addressTransport]) // Deploy it
      await assert.isFulfilled(buyerDeployedPromise, 'Could not deploy the BuyerContract'); // Check whether it's deployed
    })
  })

  describe('Interact with contracts', () => {
    let SellerContract, addressSeller, TransportContract, addressTransport, BuyerContract;

    before(async () => {
      const deployedSeller = deployer.deploy(SELLER_CONTRACT_PATH, [buyerKeyPair.publicKey, 100])
      SellerContract = await Promise.resolve(deployedSeller)
      addressSeller = SellerContract.address

      const deployedTransport = deployer.deploy(TRANSPORT_CONTRACT_PATH, ["Lagos"])
      TransportContract = await Promise.resolve(deployedTransport)
      addressTransport = TransportContract.address

      const deployedBuyer = buyerDeployer.deploy(BUYER_CONTRACT_PATH, [addressSeller, addressTransport])
      BuyerContract = await Promise.resolve(deployedBuyer)
    });

    it("Should deposit item price to SellerContract from the BuyerContract", async () => {
      let result = await BuyerContract.deposit_to_seller_contract({amount: 100})

      assert.isOk(result)
    })

    it("Should check SellerContract balance from the SellerContract", async () => {
      let result = (await SellerContract.seller_contract_balance()).decodedResult

      assert.equal(result, 100)
    })

    it("Should send item from the SellerContract", async () => {
      let result = await SellerContract.send_item()

      assert.isOk(result)
    })

    it("Should check item status from the SellerContract", async () => {
      let result = (await SellerContract.check_item_status()).decodedResult

      assert.equal(result, 'sent_to_transport_courier')
    })

    it("Should change courier location from the TransportContract", async () => {
      let result = await TransportContract.change_location("Abuja")

      assert.isOk(result)
    })

    it("Should check courier status from the TransportContract", async () => {
      let result = (await TransportContract.check_courier_status()).decodedResult

      assert.equal(result, 'on_way')
    })

    it("Should check courier location from the TransportContract", async () => {
      let result = (await TransportContract.check_courier_location()).decodedResult

      assert.equal(result, 'Abuja')
    })

    it("Should deliver item from the TransportContract", async () => {
      let result = await TransportContract.delivered_item("Jos")

      assert.isOk(result)
    })

    it("Should check courier location from BuyerContract", async () => {
      let result = (await BuyerContract.check_courier_location()).decodedResult

      assert.equal(result, 'Jos')
    })

    it("Should check courier status from BuyerContract", async () => {
      let result = (await BuyerContract.check_courier_status()).decodedResult

      assert.equal(result, 'delivered')
    })

    it("Should recieve item from BuyerContract", async () => {
      let result = await BuyerContract.received_item()

      assert.isOk(result)
    })

    it("Should check SellerContract balance from BuyerContract", async () => {
      let result = (await BuyerContract.seller_contract_balance()).decodedResult

      assert.equal(result, 0)
    })
  })
})