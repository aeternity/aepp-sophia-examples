const chai = require('chai');
let chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const assert = chai.assert;
const path = require('path');

const AeSDK = require('@aeternity/aepp-sdk');
const Universal = AeSDK.Universal;

const config = require("./constants/config.json");
const errorMessages = require('./constants/error-messages.json');
const nonFungibleFunctions = require('./constants/smartContractFunctions.json');

const utils = require('../utils/utils');
const getClient = utils.getClient;

const contractFilePath = './../contracts/non-fungible-metadata-token.aes';

// this helper is very basic implementation of library resolver  v0.0.0.0.0.1 :) :P
const libHelper = require('./../utils/library-resolver');
const contractSource = libHelper.resolveLibraries(path.resolve(__dirname, contractFilePath));

const ownerPublicKey = config.ownerKeyPair.publicKey;
const notOwnerPublicKey = config.notOwnerKeyPair.publicKey;

const tokenName = "AE Token";
const tokenSymbol = "NFT";
const firstTokenId = 1;

describe('Non-fungible Metadata token', () => {

    let firstClient;
    let secondClient;

    before(async () => {

        firstClient = await getClient(Universal, config, config.ownerKeyPair);
        secondClient = await getClient(Universal, config, config.notOwnerKeyPair);

        await firstClient.spend(1, notOwnerPublicKey)
    })

    describe('Deploy contract', async () => {
        it('deploying successfully', async () => {
            let contractObject = await firstClient.getContractInstance(contractSource);
            let deployInfo = (await contractObject.deploy([tokenName, tokenSymbol])).deployInfo;

            assert.equal(ownerPublicKey, deployInfo.owner);
        });
    });

    describe('Interact with contract', () => {
        let contract;
        let contractInstanceFromSecondAccount;

        beforeEach(async () => {

            contract = await firstClient.getContractInstance(contractSource);
            await contract.deploy([tokenName, tokenSymbol]);

            contractInstanceFromSecondAccount = await secondClient.getContractInstance(contractSource, {
                contractAddress: contract.deployInfo.address
            });
        })

        describe('Read', () => {

            it('call contract read successfully', async () => {
                const callNameResult = await contract.call(nonFungibleFunctions.NAME);
                const callSymbolResult = await contract.call(nonFungibleFunctions.SYMBOL);

                const decodedNameResult = await callNameResult.decode("string");
                const decodedSymbolResult = await callSymbolResult.decode("string");

                assert.equal(decodedNameResult, tokenName, "Mismatch token name.")
                assert.equal(decodedSymbolResult, tokenSymbol, "Mismatch token symbol.")
            });
        })

        describe('Contract functionality', () => {
            beforeEach(async () => {
                await contract.call(nonFungibleFunctions.MINT, [
                    firstTokenId,
                    ownerPublicKey
                ]);
            });

            describe('Mint', () => {
                it('should mint 1 token successfully', async () => {
                    // Arrange
                    const expectedBalance = 1;

                    // Act
                    const ownerOfToken = await contract.call(nonFungibleFunctions.OWNER_OF, [
                        firstTokenId
                    ]);

                    const balanceOfResult = await contract.call(nonFungibleFunctions.BALANCE_OF, [
                        ownerPublicKey
                    ]);

                    // Assert
                    let _ownerPublicKey = await ownerOfToken.decode('address');
                    const decodedBalanceOfResult = await balanceOfResult.decode("int");

                    assert.equal(_ownerPublicKey, ownerPublicKey)
                    assert.equal(decodedBalanceOfResult, expectedBalance)
                })

                it('should not mint from non-owner', async () => {
                    let unauthorisedPromise = contractInstanceFromSecondAccount.call(nonFungibleFunctions.MINT, [
                        firstTokenId,
                        ownerPublicKey
                    ]);

                    await assert.isRejected(unauthorisedPromise, errorMessages.ONLY_OWNER_CAN_MINT);
                })

                it('should not mint token with id that already exist', async () => {
                    // Act
                    const secondDeployContractPromise = contract.call(nonFungibleFunctions.MINT, [
                        firstTokenId,
                        ownerPublicKey
                    ]);

                    // Assert
                    await assert.isRejected(secondDeployContractPromise, errorMessages.CANNOT_OVERRIDE_TOKEN);
                })
            })

            describe('Transfer', () => {
                it('should transfer token successfully', async () => {
                    // Arrange
                    const expectedBalanceOfNotOwner = 1;
                    const expectedBalanceOfOwner = 0;

                    // Act
                    await contract.call(nonFungibleFunctions.SET_APPROVAL_FOR_ALL, [
                        ownerPublicKey,
                        true
                    ]);

                    await contract.call(nonFungibleFunctions.APPROVE, [
                        firstTokenId,
                        notOwnerPublicKey
                    ]);

                    await contract.call(nonFungibleFunctions.TRANSFER_FROM, [
                        ownerPublicKey,
                        notOwnerPublicKey,
                        firstTokenId
                    ]);

                    const balanceOfNotOwnerResult = await contract.call(nonFungibleFunctions.BALANCE_OF, [
                        config.notOwnerKeyPair.publicKey
                    ]);

                    const balanceOfOwnerResult = await contract.call(nonFungibleFunctions.BALANCE_OF, [
                        config.ownerKeyPair.publicKey
                    ]);

                    const ownerOfResult = await contract.call(nonFungibleFunctions.OWNER_OF, [
                        firstTokenId
                    ]);

                    // //Assert
                    const decodedBalanceOfNotOwnerResult = await balanceOfNotOwnerResult.decode("int");
                    const decodedBalanceOfOwnerResult = await balanceOfOwnerResult.decode("int");
                    const publicKey = await ownerOfResult.decode('address'); // await getAddress(ownerOfResult); // !!!

                    assert.equal(decodedBalanceOfNotOwnerResult, expectedBalanceOfNotOwner)
                    assert.equal(decodedBalanceOfOwnerResult, expectedBalanceOfOwner)
                    assert.equal(publicKey, config.notOwnerKeyPair.publicKey)
                })

                it('non-owner of token shouldn`t be able to call approve', async () => {
                    // Act
                    const unauthorizedApprovePromise = contractInstanceFromSecondAccount.call(nonFungibleFunctions.APPROVE, [
                        firstTokenId,
                        config.ownerKeyPair.publicKey
                    ]);

                    // Assert
                    await assert.isRejected(unauthorizedApprovePromise, errorMessages.NOT_AN_OWNER_OR_NOT_APPROVED);
                })

                it('non-owner of token shouldn`t be able to call transferFrom', async () => {
                    // Act
                    const unauthorizedTransferPromise = contractInstanceFromSecondAccount.call(nonFungibleFunctions.TRANSFER_FROM, [
                        config.notOwnerKeyPair.publicKey,
                        config.ownerKeyPair.publicKey,
                        firstTokenId
                    ]);

                    // Assert
                    await assert.isRejected(unauthorizedTransferPromise, errorMessages.NOT_APPROVED_OR_OWNER);
                })
            })

            describe('Metadata', () => {
                it('should write/read token metadata successfully', async () => {
                    // Arrange	
                    const expectedTokenURI = "Token";

                    // Act	
                    await contract.call(nonFungibleFunctions.SET_TOKEN_URI, [
                        firstTokenId,
                        expectedTokenURI
                    ]);

                    const tokenURIResult = await contract.call(nonFungibleFunctions.GET_TOKEN_URI, [
                        firstTokenId
                    ]);

                    // Assert	
                    const decodedTokenURIResult = await tokenURIResult.decode("string");

                    assert.equal(decodedTokenURIResult, expectedTokenURI);
                })
            })
        })
    })
})