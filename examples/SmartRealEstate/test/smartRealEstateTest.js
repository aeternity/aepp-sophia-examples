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
const SMARTREALESTATE_CONTRACT_PATH = "./contracts/SmartRealEstate.aes";

describe('SmartRealEstate Contract', () => {
  let deployer, instance;
  let ownerKeyPair = wallets[0];
  let newTenantAddress = wallets[1].publicKey;

  beforeEach(async () => {
    deployer = new Deployer('local', ownerKeyPair.secretKey)
  });

  describe('Interact with the contract', () => {
    it('Should deploy SmartRealEstate contract', async () => {
      const deployedPromise = deployer.deploy(SMARTREALESTATE_CONTRACT_PATH, ["Bohemian apartment", 1000, "Varna, 36 Str. Ikonomov"])

      await assert.isFulfilled(deployedPromise, 'Could not deploy the SmartRealEstate Smart Contract');
      instance = await Promise.resolve(deployedPromise)
    })

    it('Should delete owner', async () => {
      let result = await instance.delete_owner(ownerKeyPair.publicKey)
      assert.isOk(result)
    })

    it('Should create owner', async () => {
      let result = await instance.add_owner("Villa Maria", 2000, "Sofia, 4 Str. K")
      assert.isOk(result)
    })

    it('Should delete property', async () => {
      let result = await instance.delete_property("Villa Maria")
      assert.isOk(result)
    })

    it('Should add property', async () => {
      let result = await instance.add_property("Artur apartment", 1000, "Varna, 123 Str. A")
      assert.isOk(result)
    })

    it('Should get property address', async () => {
      let result = await instance.get_property_address(ownerKeyPair.publicKey, "Artur apartment")
      assert.equal(result.decodedResult, 'Varna, 123 Str. A')
    })

    it("Should get property's paymentstatus", async () => {
      let result = await instance.get_payment_status(ownerKeyPair.publicKey, "Artur apartment")
      assert.isFalse(result.decodedResult)
    })

    it("Should get property's tenant", async () => {
      let result = await instance.get_tenant(ownerKeyPair.publicKey, "Artur apartment")
      assert.equal(result.decodedResult, ownerKeyPair.publicKey)
    })

    it('Should get price of the property', async () => {
      let result = await instance.get_price(ownerKeyPair.publicKey, "Artur apartment")
      assert.equal(result.decodedResult, 1000)
    })

    it('Should change the price of the property', async () => {
      let result = await instance.change_price("Artur apartment", 3000)
      assert.isOk(result)
    })

    it('Should get the new price of the property', async () => {
      let result = await instance.get_price(ownerKeyPair.publicKey, "Artur apartment")
      assert.equal(result.decodedResult, 3000)
    })

    it('Should change the address of the property', async () => {
      let result = await instance.change_address("Artur apartment", "Sofia, 321 Str. B")
      assert.isOk(result)
    })

    it('Should get the new address of the property', async () => {
      let result = await instance.get_property_address(ownerKeyPair.publicKey, "Artur apartment")
      assert.equal(result.decodedResult, 'Sofia, 321 Str. B')
    })

    it('Should change the tenant of the property', async () => {
      let result = await instance.change_tenant("Artur apartment", newTenantAddress)
      assert.isOk(result)
    })

    it('Should get the new tenant of the property', async () => {
      let result = await instance.get_tenant(ownerKeyPair.publicKey, "Artur apartment")
      assert.equal(result.decodedResult, newTenantAddress)
    })

    it('Should pay the rent', async () => {
      let result = await instance.pay_rent(ownerKeyPair.publicKey, "Artur apartment", {amount: 3000})
      assert.isOk(result)
    })

    it("Should get property's paymentstatus after it was paid", async () => {
      let result = await instance.get_payment_status(ownerKeyPair.publicKey, "Artur apartment")
      assert.isTrue(result.decodedResult)
    })
  })
})