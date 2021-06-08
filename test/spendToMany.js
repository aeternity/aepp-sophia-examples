const chai = require('chai');
const assert = chai.assert;
const assertNode = require('assert/strict');

const { Universal, MemoryAccount, Node } = require('@aeternity/aepp-sdk');

const NETWORKS = require('../config/network.json');
const NETWORK_NAME = "local";

const {defaultWallets: WALLETS} = require('../config/wallets.json');

const contractUtils = require('../utils/contract-utils');

describe('SpendToMany', () => {
  let client;
  let spendToManyContractInstance;

  before(async () => {
    const node = await Node({ url: NETWORKS[NETWORK_NAME].nodeUrl });
    client = await Universal({
        nodes: [
          { name: NETWORK_NAME, instance: node },
        ],
        compilerUrl: NETWORKS[NETWORK_NAME].compilerUrl,
        accounts: [MemoryAccount({ keypair: WALLETS[0] })],
        address: WALLETS[0].publicKey
    });
    try {
        // path relative to root of project
        const contractContent = contractUtils.getContractContent('./contracts/SpendToMany/SpendToMany.aes');
        // initialize the contract instance
        spendToManyContractInstance = await client.getContractInstance(contractContent);
    } catch(err) {
        console.error(err);
        assert.fail('Could not initialize contract instance');
    }
  });

  describe('Deploy contract', () => {
    it('should deploy SpendToMany contract', async () => {
      const init = await spendToManyContractInstance.deploy([]);
      assert.equal(init.result.returnType, 'ok');
    });
  });

  describe('Interact with the contract', async () => {
    let sophiaMap = [];
    let genRandomTokensAmount;
    let totalTokens = 0;

    for (let i = 0; i < WALLETS.length; i++) {
        genRandomTokensAmount = Math.floor(Math.random() * 1000) + 1;
        totalTokens = totalTokens + genRandomTokensAmount;
        sophiaMap.push([WALLETS[i].publicKey, genRandomTokensAmount]);
    }

    it('should spend to multiple addresses with valid amount', async () => {
      const result = await spendToManyContractInstance.methods.spend_to_many(sophiaMap, {amount: 10000});
      assert.equal(result.decodedResult, totalTokens);
    });

    it('should spend and check balance again', async () => {
      const current_balance = await client.balance(WALLETS[1].publicKey);
      await spendToManyContractInstance.methods.spend_to_many([ [WALLETS[1].publicKey, 200] ], {amount: 10000});
      const balance_after_spend = await client.balance(WALLETS[1].publicKey);
      assert.equal(balance_after_spend, parseInt(current_balance, 10) + 200);
    });

    it('should spend to 0 addresses', async () => {
      const result = await spendToManyContractInstance.methods.spend_to_many([], {amount: 10000});
      assert.equal(result.decodedResult, 0);
    });

    it('should spend to multiple addresses with invalid amount', async () => {
      const resultPromise = spendToManyContractInstance.methods.spend_to_many(sophiaMap, {amount: 1});
      await assertNode.rejects(resultPromise);
    });
  });
});
