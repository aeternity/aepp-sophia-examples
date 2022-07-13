const { utils, wallets } = require('@aeternity/aeproject');

const chai = require('chai');
const assert = chai.assert;
const assertNode = require('assert').strict;

describe('SpendToMany', () => {
  let aeSdk;
  let spendToManyContractInstance;

  before(async () => {
    aeSdk = await utils.getSdk();
    try {
        // path relative to root of project
        const contractContent = utils.getContractContent('./contracts/SpendToMany/SpendToMany.aes');
        // initialize the contract instance
        spendToManyContractInstance = await aeSdk.getContractInstance({ source: contractContent });
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

  describe('Interact with the contract', () => {
    let sophiaMap = [];
    let totalAeAmount = 0;

    // TODO out of gas with more than 4 addresses? getting "Invocation Failed"
    for (let i = 0; i < 4; i++) {
      const randomAeAmount = Math.floor(Math.random() * 1000) + 1;
      totalAeAmount = totalAeAmount + randomAeAmount;
        sophiaMap.push([wallets[i+1].publicKey, randomAeAmount]);
    }

    it('should spend to multiple addresses with valid amount', async () => {
      const result = await spendToManyContractInstance.methods.spend_to_many(sophiaMap, { amount: totalAeAmount });
      assert.equal(result.decodedResult, totalAeAmount);
    });

    it('should spend and check balance again', async () => {
      const current_balance = await aeSdk.getBalance(wallets[1].publicKey);
      await spendToManyContractInstance.methods.spend_to_many([ [wallets[1].publicKey, 200] ], { amount: 200 });
      const balance_after_spend = await aeSdk.getBalance(wallets[1].publicKey);
      assert.equal(balance_after_spend, parseInt(current_balance, 10) + 200);
    });

    it('should spend to 0 addresses', async () => {
      const result = await spendToManyContractInstance.methods.spend_to_many([], { amount: 10000 });
      assert.equal(result.decodedResult, 0);
    });

    it('should spend to multiple addresses with invalid amount', async () => {
      const resultPromise = spendToManyContractInstance.methods.spend_to_many(sophiaMap, { amount: 1 });
      await assertNode.rejects(resultPromise);
    });
  });
});
