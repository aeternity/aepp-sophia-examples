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

const TIC_TAC_TOE_CONTRACT_FILE_PATH = "./../contracts/tic-tac-toe.aes";

const ticTacToeContractSource = utils.readFileRelative(`./contracts/${TIC_TAC_TOE_CONTRACT_FILE_PATH}`, 'utf-8')

describe('Contracts', () => {
  
  let client, ticTacToeContractInstance;

  beforeEach(async () => {
      client = await getClient(Universal, config, config.ownerKeyPair);
  });

  describe('Deploy contracts', () => {

    it('should deploy Tic Tac Toe contract', async () => {
      ticTacToeContractInstance = await client.getContractInstance(ticTacToeContractSource);
      const init = await ticTacToeContractInstance.deploy([]);
      assert.equal(init.result.returnType, 'ok');
    })
  })

  describe('Interact with the contract', () => {
    it('should set player 1 ', async () => {
      const result = await ticTacToeContractInstance.methods.make_move(11,1)
      assert.equal(result.decodedResult, "Game continues. The other player's turn.")
    })

    it('should set player 2 ', async () => {
      const result = await ticTacToeContractInstance.methods.make_move(12,2)
      assert.equal(result.decodedResult, "Game continues. The other player's turn.")
    })

    it('should set player 1 ', async () => {
      const result = await ticTacToeContractInstance.methods.make_move(33,1)
      assert.equal(result.decodedResult, "Game continues. The other player's turn.")
    })

    it('should set player 2 ', async () => {
      const result = await ticTacToeContractInstance.methods.make_move(23,2)
      assert.equal(result.decodedResult, "Game continues. The other player's turn.")
    })

    it('should set player 1 ', async () => {
      const result = await ticTacToeContractInstance.methods.make_move(31,1)
      assert.equal(result.decodedResult, "Game continues. The other player's turn.")
    })

    it('should set player 2 ', async () => {
      const result = await ticTacToeContractInstance.methods.make_move(21,2)
      assert.equal(result.decodedResult, "Game continues. The other player's turn.")
    })

    it('should win player 1 ', async () => {
      const result = await ticTacToeContractInstance.methods.make_move(32,1)
      assert.equal(result.decodedResult, "You are the winner! Congratulations player 1")
    })
  })
})
