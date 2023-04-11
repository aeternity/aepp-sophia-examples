const { utils } = require('@aeternity/aeproject');

const chai = require('chai');
const assert = chai.assert;
const assertNode = require('assert').strict;

describe('Ownable', () => {
  let ownableInstance;
  const accounts = utils.getDefaultAccounts();
  const ownerAccount = accounts[0];
  const ownerAddress = ownerAccount.address;
  const nonOwnerAccount = accounts[1];
  const nonOwnerAddress = nonOwnerAccount.address;
  const newOwnerAccount = accounts[2];
  const newOwnerAddress = newOwnerAccount.address;

  before(async () => {
    const aeSdk = await utils.getSdk();
    try {
        // path relative to root of project
        const contractContent = utils.getContractContent('./contracts/Ownable/Ownable.aes');
        // initialize the contract instance
        ownableInstance = await aeSdk.initializeContract({ sourceCode: contractContent });
    } catch(err) {
        console.error(err);
        assert.fail('Could not initialize contract instance');
    }
  });

  describe('Deploy contract', () => {
    it('should deploy Ownable contract', async () => {
      const init = await ownableInstance.init({onAccount: ownerAccount});
      assert.equal(init.result.returnType, 'ok');
      const result = await ownableInstance.owner();
      assert.equal(result.decodedResult, ownerAddress);
    });
  });

  describe('Interact with the contract', async () => {
    it('should fail when trying to receive ownership as nonOwner', async () => {
      await assertNode.rejects(ownableInstance.transfer_ownership(nonOwnerAddress, {onAccount: nonOwnerAccount}), (err) => {
        assert.include(err.message, "The caller is different than the owner");
        return true;
      });
    });

    it('should transfer ownership', async () => {
      await ownableInstance.transfer_ownership(newOwnerAddress, {onAccount: ownerAccount});
      const result = await ownableInstance.owner();
      assert.equal(result.decodedResult, newOwnerAddress);
    });

    it('should renounce ownership', async () => {
      await ownableInstance.renounce_ownership({onAccount: newOwnerAccount});
      const result = await ownableInstance.owner();
      assert.equal(result.decodedResult, undefined);
    });

    it('should fail after renounced ownership', async () => {
      await assertNode.rejects(ownableInstance.transfer_ownership(nonOwnerAddress, {onAccount: newOwnerAccount}), (err) => {
        assert.include(err.message, "Ownership has been renounced");
        return true;
      });
    });
  });
});
