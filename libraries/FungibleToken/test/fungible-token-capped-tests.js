const path = require('path');
const chai = require('chai');
let chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const assert = chai.assert;

const utils = require('../utils/utils');
const getClient = utils.getClient;

const AeSDK = require('@aeternity/aepp-sdk');
const Universal = AeSDK.Universal;

const config = require("./constants/config.json");
const fungibleTokenFunctions = require('./constants/fungible-token-functions');
const errorMessages = require('./constants/error-messages.json');
const contractFilePath = "./../contracts/fungible-token-capped.aes";

const contentOfContract = utils.readFileRelative(path.resolve(__dirname, contractFilePath), config.filesEncoding);
const ownerPublicKey = config.ownerKeyPair.publicKey;

describe('Fungible Capped Token', () => {

    let firstClient;

    before(async () => {
        firstClient = await getClient(Universal, config, config.ownerKeyPair);
    });

    describe('Deploy contract', () => {

        it('deploying successfully', async () => {
            // Arrange
            const cap = 100;

            let deployedContract = await firstClient.getContractInstance(contentOfContract);
            await deployedContract.deploy([cap]);

            // Assert
            const capPromiseResult = await deployedContract.call(fungibleTokenFunctions.CAP);
            const decodedCapPromiseResult = await capPromiseResult.decode();

            assert.equal(ownerPublicKey, deployedContract.deployInfo.owner);
            assert.equal(decodedCapPromiseResult, cap);
        })
    })

    describe('Contract functionality', () => {

        it('shoulnd`t mint over cap limit', async () => {
            // Arrange
            const cap = 100;

            let deployedContract = await firstClient.getContractInstance(contentOfContract);
            await deployedContract.deploy([cap]);

            const mintPromise = deployedContract.call(fungibleTokenFunctions.MINT, [
                ownerPublicKey,
                1000
            ]);

            // Assert
            await assert.isRejected(mintPromise, errorMessages.EXCEEDS_CAP);
        })
    })
})