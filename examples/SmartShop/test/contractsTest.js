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

  let deployer;
  let ownerKeyPair = wallets[0];

  before(async () => {
    deployer = new Deployer('local', ownerKeyPair.secretKey)
  })

  describe('Deploy contracts', () => {
    let sellerContractAddress, transportContractAddress;

    it('Deploying Seller Contract', async () => {
      const sellerDeployedPromise = deployer.deploy(SELLER_CONTRACT_PATH) // Deploy it
  
      await assert.isFulfilled(sellerDeployedPromise, 'Could not deploy the SellerContract.aes Smart Contract'); // Check whether it's deployed
      sellerContractAddress = (await Promise.resolve(sellerDeployedPromise)).address
    })

    it('Deploying Transport Contract', async () => {
      const transportDeployedPromise = deployer.deploy(TRANSPORT_CONTRACT_PATH, ["Lagos"]) // Deploy it
  
      await assert.isFulfilled(transportDeployedPromise, 'Could not deploy the TransportContract.aes Smart Contract'); // Check whether it's deployed
      transportContractAddress = (await Promise.resolve(transportDeployedPromise)).address
    })

    it('Deploying Buyer Contract', async () => {
      const buyerDeployedPromise = deployer.deploy(BUYER_CONTRACT_PATH, [sellerContractAddress, transportContractAddress]) // Deploy it
  
      await assert.isFulfilled(buyerDeployedPromise, 'Could not deploy the BuyerContract.aes Smart Contract'); // Check whether it's deployed
      await Promise.resolve(buyerDeployedPromise)
    })
  })

  describe('Interact with contracts', () => {
    let BuyerContract, SellerContract, addressSeller, TransportContract, addressTransport;

    before(async () => {
      const deployedSeller = deployer.deploy(SELLER_CONTRACT_PATH)
      SellerContract = await Promise.resolve(deployedSeller)
      addressSeller = SellerContract.address

      const deployedTransport = deployer.deploy(TRANSPORT_CONTRACT_PATH, ["Lagos"])
      TransportContract = await Promise.resolve(deployedTransport)
      addressTransport = TransportContract.address

      const deployedBuyer = deployer.deploy(BUYER_CONTRACT_PATH, [addressSeller, addressTransport])
      BuyerContract = await Promise.resolve(deployedBuyer)
    });

    it("Should deposit tokens to seller's contract", async () => {
      let result = await BuyerContract.deposit_to_seller_contract({amount: 100})

      assert.isOk(result)
    })

    it("Should check seller's contract balance", async () => {
      let result = (await SellerContract.seller_contract_balance()).decodedResult

      assert.equal(result, 100)
    })

    it("Should send item", async () => {
      let result = await SellerContract.send_item()

      assert.isOk(result)
    })

    it("Should check item status", async () => {
      let result = (await SellerContract.check_item_status()).decodedResult

      assert.equal(result, 'sent_to_transport_courier')
    })

    it("Should change courier location", async () => {
      let result = await TransportContract.change_location("Abuja")

      assert.isOk(result)
    })

    it("Should check courier status", async () => {
      let result = (await TransportContract.check_courier_status()).decodedResult

      assert.equal(result, 'on_way')
    })

    it("Should check courier location", async () => {
      let result = (await TransportContract.check_courier_location()).decodedResult

      assert.equal(result, 'Abuja')
    })

    it("Should deliver item", async () => {
      let result = await TransportContract.delivered_item("Jos")

      assert.isOk(result)
    })

    it("Should check courier location from Buyer contract", async () => {
      let result = (await BuyerContract.check_courier_location()).decodedResult

      assert.equal(result, 'Jos')
    })

    it("Should check courier status from Buyer contract", async () => {
      let result = (await BuyerContract.check_courier_status()).decodedResult

      assert.equal(result, 'delivered')
    })

    it("Should recieve item from Buyer contract", async () => {
      let result = (await BuyerContract.received_item()).decodedResult

      assert.equal(result, true)
    })

    it("Should check seller's contract balance", async () => {
      let result = (await SellerContract.seller_contract_balance()).decodedResult

      assert.equal(result, 0)
    })
  })
})