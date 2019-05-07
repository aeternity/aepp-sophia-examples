const path = require('path');
const chai = require('chai');
let chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const assert = chai.assert;

const AeSDK = require('@aeternity/aepp-sdk');
const Universal = AeSDK.Universal;

const utils = require('./../utils/utils');
const getClient = utils.getClient;

const config = require("./constants/config.json");
const errorMessages = require('./constants/error-messages.json');
const fungibleTokenFunctions = require('./constants/fungible-token-functions');
const contractFilePath = "./../contracts/fungible-token.aes";

const ownerPublicKey = config.ownerKeyPair.publicKey;
const notOwnerPublicKey = config.notOwnerKeyPair.publicKey;
const contentOfContract = utils.readFileRelative(path.resolve(__dirname, contractFilePath), config.filesEncoding);

describe('Fungible token', () => {

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
    });

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

            describe('Mint', () => {
                it('should mint 1000 token successfully', async () => {
                    // Arrange
                    const expectedBalance = 1000;

                    // Act
                    const balanceOfResult = await deployedContract.call(fungibleTokenFunctions.BALANCE_OF, [
                        ownerPublicKey
                    ]);

                    // Assert
                    const decodedBalanceOfResult = await balanceOfResult.decode();
                    assert.equal(decodedBalanceOfResult, expectedBalance)
                })

                it('should not mint from non-owner', async () => {

                    let contractInstanceFromSecondAccount = await secondClient.getContractInstance(contentOfContract, {
                        contractAddress: deployedContract.deployInfo.address
                    });

                    const unauthorisedPromise = contractInstanceFromSecondAccount.call(fungibleTokenFunctions.MINT, [
                        ownerPublicKey,
                        123
                    ]);

                    await assert.isRejected(unauthorisedPromise, errorMessages.ONLY_OWNER_CAN_MINT);
                })

                it('should increase total supply on mint', async () => {
                    // Arrange
                    const expectedTotalSupply = 1003;

                    // Act
                    // 1000 tokens are already minted
                    await deployedContract.call(fungibleTokenFunctions.MINT, [
                        ownerPublicKey,
                        1
                    ]);

                    await deployedContract.call(fungibleTokenFunctions.MINT, [
                        ownerPublicKey,
                        1
                    ]);

                    await deployedContract.call(fungibleTokenFunctions.MINT, [
                        ownerPublicKey,
                        1
                    ]);

                    const totalSupplyResult = await deployedContract.call(fungibleTokenFunctions.TOTAL_SUPPLY);

                    // Assert
                    const totalSupplyResultDecoded = await totalSupplyResult.decode();
                    assert.equal(totalSupplyResultDecoded, expectedTotalSupply)
                })

            })

            describe('Burn', () => {
                it('should burn token successfully', async () => {
                    // Arrange
                    const expectedBalance = 900;
                    const burnAmount = 100;

                    // Act
                    await deployedContract.call(fungibleTokenFunctions.BURN, [
                        burnAmount
                    ]);

                    const balanceOfResult = await deployedContract.call(fungibleTokenFunctions.BALANCE_OF, [
                        ownerPublicKey
                    ]);

                    // Assert
                    const decodedBalanceOfResult = await balanceOfResult.decode();
                    assert.equal(decodedBalanceOfResult, expectedBalance);
                })

                it('shouldn`t burn more tokens than it has', async () => {
                    let contractInstanceFromSecondAccount = await secondClient.getContractInstance(contentOfContract, {
                        contractAddress: deployedContract.deployInfo.address
                    });

                    // Arrange
                    const burnAmount = 100;

                    // Act
                    const unauthorizedBurnPromise = contractInstanceFromSecondAccount.call(fungibleTokenFunctions.BURN, [
                        burnAmount
                    ]);

                    // Assert
                    await assert.isRejected(unauthorizedBurnPromise, errorMessages.LESS_TOKENS_THAN_ACCOUNT_BALANCE);
                })

                it('should decrease total supply on burn', async () => {
                    // Arrange
                    const expectedTotalSupply = 900;
                    const burnAmount = 50;

                    // Act
                    await deployedContract.call(fungibleTokenFunctions.BURN, [
                        burnAmount
                    ]);

                    await deployedContract.call(fungibleTokenFunctions.BURN, [
                        burnAmount
                    ]);

                    const balanceOfResult = await deployedContract.call(fungibleTokenFunctions.TOTAL_SUPPLY);

                    // Assert
                    const decodedBalanceOfResult = await balanceOfResult.decode();
                    assert.equal(decodedBalanceOfResult, expectedTotalSupply)
                })
            })

            describe('Transfer', async () => {

                it('should transfer token successfully', async () => {
                    // Arrange
                    const expectedBalanceOfNotOwner = 10;
                    const expectedBalanceOfOwner = 990;
                    const transferAmount = 10;

                    // Act
                    await deployedContract.call(fungibleTokenFunctions.APPROVE, [
                        notOwnerPublicKey,
                        transferAmount
                    ]);

                    let contractInstanceFromSecondAccount = await secondClient.getContractInstance(contentOfContract, {
                        contractAddress: deployedContract.deployInfo.address
                    });

                    await contractInstanceFromSecondAccount.call(fungibleTokenFunctions.TRANSFER_FROM, [
                        ownerPublicKey,
                        notOwnerPublicKey,
                        transferAmount
                    ]);

                    const balanceOfNotOwnerResult = await deployedContract.call(fungibleTokenFunctions.BALANCE_OF, [
                        notOwnerPublicKey
                    ]);

                    const balanceOfOwnerResult = await deployedContract.call(fungibleTokenFunctions.BALANCE_OF, [
                        ownerPublicKey
                    ]);

                    // Assert
                    const decodedBalanceOfNotOwnerResult = await balanceOfNotOwnerResult.decode();
                    const decodedBalanceOfOwnerResult = await balanceOfOwnerResult.decode();

                    assert.equal(decodedBalanceOfNotOwnerResult, expectedBalanceOfNotOwner)
                    assert.equal(decodedBalanceOfOwnerResult, expectedBalanceOfOwner)
                })

                it('shouldn`t transfer token without approve', async () => {

                    let contractInstanceFromSecondAccount = await secondClient.getContractInstance(contentOfContract, {
                        contractAddress: deployedContract.deployInfo.address
                    });

                    // Arrange
                    const expectedBalanceOfNotOwner = 0;
                    const expectedBalanceOfOwner = 1000;
                    const transferAmount = 123;

                    // Act
                    const transferFromPromise = contractInstanceFromSecondAccount.call(fungibleTokenFunctions.TRANSFER_FROM, [
                        ownerPublicKey,
                        notOwnerPublicKey,
                        transferAmount
                    ]);

                    await assert.isRejected(transferFromPromise, errorMessages.VALUE_IS_BIGGER_THAN_ALLOWED);

                    const balanceOfNotOwnerResult = await deployedContract.call(fungibleTokenFunctions.BALANCE_OF, [
                        notOwnerPublicKey
                    ]);

                    const balanceOfOwnerResult = await deployedContract.call(fungibleTokenFunctions.BALANCE_OF, [
                        ownerPublicKey
                    ]);

                    // Assert
                    const decodedBalanceOfNotOwnerResult = await balanceOfNotOwnerResult.decode();
                    const decodedBalanceOfOwnerResult = await balanceOfOwnerResult.decode();

                    assert.equal(decodedBalanceOfNotOwnerResult, expectedBalanceOfNotOwner)
                    assert.equal(decodedBalanceOfOwnerResult, expectedBalanceOfOwner)
                })
            })

            describe('Transfer', () => {
                it('should increase allowance successfully', async () => {
                    // Arrange
                    const expectedAllowance = 20;
                    const transferAmount = 10;

                    // Act
                    await deployedContract.call(fungibleTokenFunctions.APPROVE, [
                        notOwnerPublicKey,
                        transferAmount
                    ]);

                    await deployedContract.call(fungibleTokenFunctions.INCREASE_ALLOWANCE, [
                        notOwnerPublicKey,
                        transferAmount
                    ]);

                    const allowancePromiseResult = await deployedContract.call(fungibleTokenFunctions.ALLOWANCE, [
                        ownerPublicKey,
                        notOwnerPublicKey
                    ]);

                    // Assert
                    const allowanceResult = await allowancePromiseResult.decode();

                    assert.equal(allowanceResult, expectedAllowance)
                })

                it('should deccrease allowance successfully', async () => {
                    // Arrange
                    const expectedAllowance = 9;
                    const transferAmount = 10;
                    const decreaseAmount = 1;

                    // Act
                    await deployedContract.call(fungibleTokenFunctions.APPROVE, [
                        notOwnerPublicKey,
                        transferAmount
                    ]);

                    await deployedContract.call(fungibleTokenFunctions.DECREASE_ALLOWANCE, [
                        notOwnerPublicKey,
                        decreaseAmount
                    ]);

                    const allowancePromiseResult = await deployedContract.call(fungibleTokenFunctions.ALLOWANCE, [
                        ownerPublicKey,
                        notOwnerPublicKey
                    ]);

                    // Assert
                    const allowanceResult = await allowancePromiseResult.decode();

                    assert.equal(allowanceResult, expectedAllowance)
                })
            })
        })
    })
})