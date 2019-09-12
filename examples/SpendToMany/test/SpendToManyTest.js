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

const SPEND_TO_MANY_CONTRACT_FILE_PATH = "./../contracts/spend-to-many.aes";

const spendToManyContractSource = utils.readFileRelative(`./contracts/${SPEND_TO_MANY_CONTRACT_FILE_PATH}`, 'utf-8')

describe('Contracts', () => {
  
  let client, spendToManyContractInstance;

  beforeEach(async () => {
      client = await getClient(Universal, config, config.ownerKeyPair);
  });


  describe('Deploy contracts', () => {

    it('should deploy Spend To Many contract', async () => {
      spendToManyContractInstance = await client.getContractInstance(spendToManyContractSource);
      const init = await spendToManyContractInstance.deploy([]);
      assert.equal(init.result.returnType, 'ok');
    })
  })

  describe('Interact with the contract', async () => {
    let sophiaMap = [];
    let genRandomTokensAmount
    let totalTokens = 0

    for (let i = 0; i < wallets.length; i++) {
        genRandomTokensAmount = Math.floor(Math.random() * 1000) + 1
        totalTokens = totalTokens + genRandomTokensAmount
        sophiaMap.push([wallets[i].publicKey, genRandomTokensAmount])
    }

    it('should spend to multiple addresses with valid amount', async () => {
      const result = await spendToManyContractInstance.methods.spend_to_many(sophiaMap, {amount: 10000})
      assert.equal(result.decodedResult, totalTokens)
    })

    it('should spend and check balance again', async () => {
      let current_balance = await client.balance(wallets[1].publicKey)
      let args = [ [wallets[1].publicKey, 200] ]
      await spendToManyContractInstance.methods.spend_to_many(args, {amount: 10000})
      let balance_after_spend = await client.balance(wallets[1].publicKey)
      assert.equal(balance_after_spend, parseInt(current_balance, 10) + 200)
    })

    it('should spend to 0 addresses', async () => {
      const result = await spendToManyContractInstance.methods.spend_to_many([], {amount: 10000})
      assert.equal(result.decodedResult, 0)
    })

    it('should spend to multiple addresses with invalid amount', async () => {
      const result = spendToManyContractInstance.methods.spend_to_many(sophiaMap, {amount: 1})
      await assert.isRejected(result)
    })
  })
})
