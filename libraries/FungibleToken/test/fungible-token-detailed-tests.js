const path = require('path');
const chai = require('chai');
let chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const assert = chai.assert;

const AeSDK = require('@aeternity/aepp-sdk');
const Universal = AeSDK.Universal;

const config = require("./constants/config.json");
const fungibleTokenFunctions = require('./constants/fungible-token-functions');
const contractFilePath = "./../contracts/fungible-token-detailed.aes";
const utils = require('../utils/utils');
const getClient = utils.getClient;

const contentOfContract = utils.readFileRelative(path.resolve(__dirname, contractFilePath), config.filesEncoding);
const ownerPublicKey = config.ownerKeyPair.publicKey;

describe('Fungible Detailed Token', () => {

    let firstClient;

    before(async () => {
        firstClient = await getClient(Universal, config, config.ownerKeyPair);
    });

    describe('Deploy contract', () => {

        it('deploying successfully', async () => {
            // Arrange
            const expectedName = "UnitTest"
            const expectedSymbol = "TT"
            const expectedDecimals = 18;

            let deployedContract = await firstClient.getContractInstance(contentOfContract);
            await deployedContract.deploy([
                expectedName,
                expectedSymbol,
                expectedDecimals
            ]);

            const namePromiseResult = await deployedContract.call(fungibleTokenFunctions.NAME);
            const symbolPromiseResult = await deployedContract.call(fungibleTokenFunctions.SYMBOL);
            const decimalsPromiseResult = await deployedContract.call(fungibleTokenFunctions.DECIMALS);

            // Assert
            const decodedNamePromiseResult = await namePromiseResult.decode();
            const decodedSymbolPromiseResult = await symbolPromiseResult.decode();
            const decodedDecimalsPromiseResult = await decimalsPromiseResult.decode();

            assert.equal(ownerPublicKey, deployedContract.deployInfo.owner);
            assert.equal(decodedNamePromiseResult, expectedName)
            assert.equal(decodedSymbolPromiseResult, expectedSymbol)
            assert.equal(decodedDecimalsPromiseResult, expectedDecimals)
        })
    })
})