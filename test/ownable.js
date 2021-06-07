const chai = require('chai');
const assert = chai.assert;
const assertNode = require('assert/strict');

const { Universal, MemoryAccount, Node } = require('@aeternity/aepp-sdk');

const NETWORKS = require('../config/network.json');
const NETWORK_NAME = "local";

const {defaultWallets: WALLETS} = require('../config/wallets.json');

const contractUtils = require('../utils/contract-utils');

describe('Ownable', () => {
  let ownableInstance;
  const owner = WALLETS[0];
  const nonOwner = WALLETS[1];
  const newOwner = WALLETS[2];

  before(async () => {
    const node = await Node({ url: NETWORKS[NETWORK_NAME].nodeUrl });
    const client = await Universal({
        nodes: [
          { name: NETWORK_NAME, instance: node },
        ],
        compilerUrl: NETWORKS[NETWORK_NAME].compilerUrl,
        accounts: [
          MemoryAccount({ keypair: nonOwner }),
          MemoryAccount({ keypair: owner }),
          MemoryAccount({ keypair: newOwner })
        ],
        address: owner.publicKey
    });
    try {
        // path relative to root of project
        const contractContent = contractUtils.getContractContent('./contracts/Ownable/Ownable.aes');
        // initialize the contract instance
        ownableInstance = await client.getContractInstance(contractContent);
    } catch(err) {
        console.error(err);
        assert.fail('Could not initialize contract instance');
    }
  });

  describe('Deploy contract', () => {
    it('should deploy Ownable contract', async () => {
      const init = await ownableInstance.deploy([], {onAccount: owner.publicKey});
      assert.equal(init.result.returnType, 'ok');
      const result = await ownableInstance.methods.owner();
      assert.equal(result.decodedResult, owner.publicKey);
    });
  });

  describe('Interact with the contract', async () => {
    it('should fail when trying to receive ownership as nonOwner', async () => {
      await assertNode.rejects(ownableInstance.methods.transfer_ownership(nonOwner.publicKey, {onAccount: nonOwner.publicKey}), (err) => {
        assert.include(err.message, "The caller is different than the owner");
        return true;
      });
    });

    it('should transfer ownership', async () => {
      await ownableInstance.methods.transfer_ownership(newOwner.publicKey, {onAccount: owner.publicKey});
      const result = await ownableInstance.methods.owner();
      assert.equal(result.decodedResult, newOwner.publicKey);
    });

    it('should renounce ownership', async () => {
      await ownableInstance.methods.renounce_ownership({onAccount: newOwner.publicKey});
      const result = await ownableInstance.methods.owner();
      assert.equal(result.decodedResult, undefined);
    });

    it('should fail after renounced ownership', async () => {
      await assertNode.rejects(ownableInstance.methods.transfer_ownership(nonOwner.publicKey, {onAccount: newOwner.publicKey}), (err) => {
        assert.include(err.message, "Ownership has been renounced");
        return true;
      });
    });
  });
});
