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
const errorMessages = require('./constants/error-messages.json');
const fungibleTokenFunctions = require('./constants/fungible-token-functions');
const contractFilePath = "./../contracts/fungible-token-pausable.aes";

const contentOfContract = utils.readFileRelative(path.resolve(__dirname, contractFilePath), config.filesEncoding);
const ownerPublicKey = config.ownerKeyPair.publicKey;
const notOwnerPublicKey = config.notOwnerKeyPair.publicKey;

describe('Fungible Pauseable Token', () => {

    let firstClient;
    let secondClient;

    before(async () => {
        firstClient = await getClient(Universal, config, config.ownerKeyPair);
        secondClient = await getClient(Universal, config, config.notOwnerKeyPair);
    });

    describe('Deploy contract', () => {

        it('deploying successfully', async () => {
            let contractObject = await firstClient.getContractInstance(contentOfContract);
            await contractObject.deploy([]);

            assert.equal(ownerPublicKey, contractObject.deployInfo.owner);
        });
    })

    describe('Interact with contract', () => {
        let deployedContract;

        beforeEach(async () => {
            deployedContract = await firstClient.getContractInstance(contentOfContract);
            await deployedContract.deploy([]);
        })

        describe('Contract functionality', () => {
            beforeEach(async () => {
                await deployedContract.call(fungibleTokenFunctions.MINT, [
                    ownerPublicKey,
                    1000
                ]);
            })

            describe('Pause', () => {
                it('should pause contract successfully', async () => {
                    // Arrange
                    const expectedValue = true;

                    // Act
                    await deployedContract.call(fungibleTokenFunctions.PAUSE);

                    const pausedPromiseResult = await deployedContract.call(fungibleTokenFunctions.PAUSED);

                    // Assert
                    const pausedResult = await pausedPromiseResult.decode();
                    assert.equal(pausedResult, expectedValue)
                })

                it('should not pause contract from non-owner', async () => {
                    let contractInstanceFromSecondAccount = await secondClient.getContractInstance(contentOfContract, {
                        contractAddress: deployedContract.deployInfo.address
                    });

                    const unauthorisedPromise = contractInstanceFromSecondAccount.call(fungibleTokenFunctions.PAUSE)

                    await assert.isRejected(unauthorisedPromise, errorMessages.ONLY_OWNER_CAN_MINT);
                })

                it('shouldn`t mint when contract is paused', async () => {

                    // Act
                    await deployedContract.call(fungibleTokenFunctions.PAUSE);

                    const mintPromise = deployedContract.call(fungibleTokenFunctions.MINT, [
                        ownerPublicKey,
                        1
                    ])

                    // Assert
                    await assert.isRejected(mintPromise, errorMessages.CONTRACT_IS_PAUSED);
                })

                it('shouldn`t burn when contract is paused', async () => {
                    // Arrange
                    const burnAmount = 10;

                    // Act
                    await deployedContract.call(fungibleTokenFunctions.PAUSE);

                    const burnPromise = deployedContract.call(fungibleTokenFunctions.BURN, [
                        burnAmount
                    ]);

                    // Assert
                    await assert.isRejected(burnPromise, errorMessages.CONTRACT_IS_PAUSED);
                })

                it('shouldn`t approve when contract is paused', async () => {
                    // Arrange
                    const transferAmount = 10;

                    // Act
                    await deployedContract.call(fungibleTokenFunctions.PAUSE);

                    const approvePromise = deployedContract.call(fungibleTokenFunctions.APPROVE, [
                        notOwnerPublicKey,
                        transferAmount
                    ]);

                    // Assert
                    await assert.isRejected(approvePromise, errorMessages.CONTRACT_IS_PAUSED);
                })

                it('shouldn`t transfer when contract is paused with already approved coins', async () => {
                    let contractInstanceFromSecondAccount = await secondClient.getContractInstance(contentOfContract, {
                        contractAddress: deployedContract.deployInfo.address
                    });

                    // Arrange
                    const transferAmount = 10;

                    // Act
                    await deployedContract.call(fungibleTokenFunctions.APPROVE, [
                        notOwnerPublicKey,
                        transferAmount
                    ]);

                    await deployedContract.call(fungibleTokenFunctions.PAUSE);

                    const transferFromPromise = contractInstanceFromSecondAccount.call(fungibleTokenFunctions.TRANSFER_FROM, [
                        ownerPublicKey,
                        notOwnerPublicKey,
                        transferAmount
                    ]);

                    // Assert
                    await assert.isRejected(transferFromPromise, errorMessages.CONTRACT_IS_PAUSED);
                })
            })
        })
    })
})