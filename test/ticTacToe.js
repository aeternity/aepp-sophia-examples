const { utils } = require('@aeternity/aeproject');

const chai = require('chai');
const assert = chai.assert;
const assertNode = require('assert').strict;

describe('TicTacToe', () => {
  
  let ticTacToeContractInstance;

  before(async () => {
    const aeSdk = await utils.getSdk();
    try {
        // path relative to root of project
        const contractContent = utils.getContractContent('./contracts/TicTacToe/TicTacToe.aes');
        // initialize the contract instance
        ticTacToeContractInstance = await aeSdk.getContractInstance({ source: contractContent });
    } catch(err) {
        console.error(err);
        assert.fail('Could not initialize contract instance');
    }
  });

  describe('Deploy contract', () => {
    it('should deploy TicTacToe contract', async () => {
      const init = await ticTacToeContractInstance.deploy([]);
      assert.equal(init.result.returnType, 'ok');
    });
  });

  describe('Interact with the contract', () => {
    it('should reject with invalid position', async () => {
      await assertNode.rejects(ticTacToeContractInstance.methods.make_move(41,1), (err) => {
        assert.include(err.message, 'Incorrect position!');
        return true;
      });
    });

    it('should reject with invalid player', async () => {
      await assertNode.rejects(ticTacToeContractInstance.methods.make_move(11,3), (err) => {
        assert.include(err.message, 'Invalid player!');
        return true;
      });
    });

    it('should make move as player 1', async () => {
      const result = await ticTacToeContractInstance.methods.make_move(11,1);
      assert.equal(result.decodedResult, `Game continues. The other player's turn.`);
    });

    it('should reject not your turn', async () => {
      await assertNode.rejects(ticTacToeContractInstance.methods.make_move(12,1), (err) => {
        assert.include(err.message, `It's not your turn! Player 2 has to play now!`);
        return true;
      });
    });

    it('should reject place already taken', async () => {
      await assertNode.rejects(ticTacToeContractInstance.methods.make_move(11,2), (err) => {
        assert.include(err.message, 'Place is already taken!');
        return true;
      });
    });

    it('should make move as player 2', async () => {
      const result = await ticTacToeContractInstance.methods.make_move(12,2);
      assert.equal(result.decodedResult, `Game continues. The other player's turn.`);
    });

    it('should make move as player 1', async () => {
      const result = await ticTacToeContractInstance.methods.make_move(33,1);
      assert.equal(result.decodedResult, `Game continues. The other player's turn.`);
    });

    it('should make move as player 2', async () => {
      const result = await ticTacToeContractInstance.methods.make_move(23,2);
      assert.equal(result.decodedResult, `Game continues. The other player's turn.`);
    });

    it('should make move as player 1', async () => {
      const result = await ticTacToeContractInstance.methods.make_move(31,1);
      assert.equal(result.decodedResult, `Game continues. The other player's turn.`);
    });

    it('should make move as player 2', async () => {
      const result = await ticTacToeContractInstance.methods.make_move(21,2);
      assert.equal(result.decodedResult, `Game continues. The other player's turn.`);
    });

    it('should win as player 1', async () => {
      const result = await ticTacToeContractInstance.methods.make_move(32,1);
      assert.equal(result.decodedResult, 'You are the winner! Congratulations player 1');
    });
  });
});
