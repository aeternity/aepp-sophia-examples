const chai = require('chai');
let chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const assert = chai.assert;
const utils = require('./../utils/utils');
const AeSDK = require('@aeternity/aepp-sdk');
const Universal = AeSDK.Universal;
const config = require("./constants/config.json");
const contractFilePath = "./../contracts/fungible-token-detailed.aes";

const path = require('path');

const fungibleTokenFunctions = require('./constants/fungible-token-functions');

describe('Fungible Detailed Token', () => {

    let firstClient;
    let contentOfContract;

    before(async () => {
        firstClient = await Universal({
            url: config.host,
            internalUrl: config.internalHost,
            keypair: config.ownerKeyPair,
            nativeMode: true,
            networkId: config.networkId
        });

        firstClient.setKeypair(config.ownerKeyPair)
        await firstClient.spend(1, config.notOwnerKeyPair.publicKey)

        contentOfContract = utils.readFileRelative(path.resolve(__dirname, contractFilePath), config.filesEncoding);
    })

    describe('Deploy contract', () => {

        it('deploying successfully', async () => {
            //Arrange
            const expectedName = "UnitTest"
            const expectedSymbol = "TT"
            const expectedDecimals = 18;
            const compiledContract = await firstClient.contractCompile(contentOfContract, {})

            //Act
            const deployPromise = compiledContract.deploy({
                initState: `("${expectedName}", "${expectedSymbol}", ${expectedDecimals})`,
                options: {
                    ttl: config.ttl
                },
                abi: config.abiType
            });
            
            const deployedContract = await deployPromise;

            const namePromise = deployedContract.call(fungibleTokenFunctions.NAME, {
                options: {
                    ttl: config.ttl
                }
            });
            
            const namePromiseResult = await namePromise;

            const symbolPromise = deployedContract.call(fungibleTokenFunctions.SYMBOL, {
                options: {
                    ttl: config.ttl
                }
            });
            
            const symbolPromiseResult = await symbolPromise;

            const decimalsPromise = deployedContract.call(fungibleTokenFunctions.DECIMALS, {
                options: {
                    ttl: config.ttl
                }
            });
            
            const decimalsPromiseResult = await decimalsPromise;

            //Assert
            const decodedNamePromiseResult = await namePromiseResult.decode("string");
            const decodedSymbolPromiseResult = await symbolPromiseResult.decode("string");
            const decodedDecimalsPromiseResult = await decimalsPromiseResult.decode("int");

            assert.equal(config.ownerKeyPair.publicKey, deployedContract.owner)
            assert.equal(decodedNamePromiseResult.value, expectedName)
            assert.equal(decodedSymbolPromiseResult.value, expectedSymbol)
            assert.equal(decodedDecimalsPromiseResult.value, expectedDecimals)
        })
    })
})