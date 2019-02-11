const chai = require('chai');
let chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const assert = chai.assert;
const path = require('path');

const config = require("./constants/config.json")
const utils = require('../utils/utils');
const errorMessages = require('./constants/error-messages.json');

const bytes = require('@aeternity/aepp-sdk/es/utils/bytes');
const AeSDK = require('@aeternity/aepp-sdk');
const Universal = AeSDK.Universal;
const crypto = AeSDK.Crypto;

const contractFilePath = './../contracts/non-fungible-full-token.aes';

const tokenName = "AE Token";
const tokenSymbol = "NFT";
const firstTokenId = 1;

const ownerPublicKeyAsHex = utils.publicKeyToHex(config.ownerKeyPair.publicKey);
const notOwnerPublicKeyAsHex = utils.publicKeyToHex(config.notOwnerKeyPair.publicKey);

const nonFungibleFunctions = require('./constants/smartContractFunctions.json');

async function getAddress(info) {
	const addressAsHex = (await info.decode("address")).value;
	return utils.decodedHexAddressToPublicAddress(addressAsHex);
}

describe('Non-fungible token', () => {

	let firstClient;
	let secondClient;
	let contentOfContract = utils.readFileRelative(path.resolve(__dirname, contractFilePath), config.filesEncoding);

	before(async () => {

		firstClient = await Universal({
			url: config.host,
			internalUrl: config.internalHost,
			keypair: config.ownerKeyPair,
			nativeMode: true,
			networkId: config.networkId
		});

		secondClient = await Universal({
			url: config.host,
			internalUrl: config.internalHost,
			keypair: config.notOwnerKeyPair,
			nativeMode: true,
			networkId: config.networkId
		});

		firstClient.setKeypair(config.ownerKeyPair)
		await firstClient.spend(1, config.notOwnerKeyPair.publicKey)
	})

	describe('Deploy contract', () => {

		it('deploying successfully', async () => {
			//Arrange
			const compiledContract = await firstClient.contractCompile(contentOfContract, {})

			//Act
			const deployPromise = compiledContract.deploy({
				initState: `("${tokenName}", "${tokenSymbol}")`,
				options: {
					ttl: config.ttl
				},
				abi: config.abiType
			});
			
			//Assert
			const deployedContract = await deployPromise;

			assert.equal(config.ownerKeyPair.publicKey, deployedContract.owner)
		})
	})

	describe('Interact with contract', () => {
		let deployedContract;
		let compiledContract;

		beforeEach(async () => {
			compiledContract = await firstClient.contractCompile(contentOfContract, {
				gas: config.gas
			})
			deployedContract = await compiledContract.deploy({
				initState: `("${tokenName}", "${tokenSymbol}")`,
				options: {
					ttl: config.ttl
				},
				abi: config.abiType
			});
		})

		describe('Read', () => {
			it('call contract read successfully', async () => {
				//Arrange

				//Act
				const callNamePromise = deployedContract.call(nonFungibleFunctions.NAME, {
					options: {
						ttl: config.ttl
					}
				});
				
				const callNameResult = await callNamePromise;

				const callSymbolPromise = deployedContract.call(nonFungibleFunctions.SYMBOL, {
					options: {
						ttl: config.ttl
					}
				});
				
				const callSymbolResult = await callSymbolPromise;

				//Assert
				const decodedNameResult = await callNameResult.decode("string");
				const decodedSymbolResult = await callSymbolResult.decode("string");

				assert.equal(decodedNameResult.value, tokenName)
				assert.equal(decodedSymbolResult.value, tokenSymbol)
			})
		})

		describe('Contract functionality', () => {
			beforeEach(async () => {
				const deployContractPromise = deployedContract.call(nonFungibleFunctions.MINT, {
					args: `(${firstTokenId}, ${ownerPublicKeyAsHex})`,
					options: {
						ttl: config.ttl
					},
					abi: config.abiType
				})
				
				await deployContractPromise;
			})

			describe('Mint', () => {
				it('should mint 1 token successfully', async () => {
					//Arrange
					const expectedBalance = 1;

					//Act
					const ownerOfPromise = deployedContract.call(nonFungibleFunctions.OWNER_OF, {
						args: `(${firstTokenId})`,
						options: {
							ttl: config.ttl
						}
					});
					
					const ownerOfResult = await ownerOfPromise;

					const balanceOfPromise = deployedContract.call(nonFungibleFunctions.BALANCE_OF, {
						args: `(${ownerPublicKeyAsHex})`,
						options: {
							ttl: config.ttl
						}
					});
					
					const balanceOfResult = await balanceOfPromise;

					//Assert
					const decodedOwnerOfResult = await ownerOfResult
					let encodedData = await decodedOwnerOfResult.decode('address')
					const ownerPublicKey = crypto.aeEncodeKey(bytes.toBytes(encodedData.value, true))

					const decodedBalanceOfResult = await balanceOfResult.decode("int");

					assert.equal(ownerPublicKey, config.ownerKeyPair.publicKey)
					assert.equal(decodedBalanceOfResult.value, expectedBalance)
				})

				it('should not mint from non-owner', async () => {
					const unauthorisedPromise = secondClient.contractCall(compiledContract.bytecode, config.abiType, deployedContract.address, nonFungibleFunctions.MINT, {
						args: `(${firstTokenId}, ${ownerPublicKeyAsHex})`,
						options: {
							ttl: config.ttl
						}
					})
					await assert.isRejected(unauthorisedPromise, errorMessages.ONLY_OWNER_CAN_MINT);
				})

				it('should not mint token with id that already exist', async () => {
					//Arrange

					//Act
					const secondDeployContractPromise = deployedContract.call(nonFungibleFunctions.MINT, {
						args: `(${firstTokenId}, ${ownerPublicKeyAsHex})`,
						options: {
							ttl: config.ttl
						}
					})

					//Assert
					await assert.isRejected(secondDeployContractPromise, errorMessages.CANNOT_OVERRIDE_TOKEN);
				})
			})

			describe('Burn', () => {
				it('should burn token successfully', async () => {
					//Arrange
					const expectedBalance = 0;

					//Act
					const ownerOfPromise = deployedContract.call(nonFungibleFunctions.BURN, {
						args: `(${firstTokenId})`,
						options: {
							ttl: config.ttl
						}
					});
					
					await ownerOfPromise;

					const balanceOfPromise = deployedContract.call(nonFungibleFunctions.BALANCE_OF, {
						args: `(${ownerPublicKeyAsHex})`,
						options: {
							ttl: config.ttl
						}
					});
					
					const balanceOfResult = await balanceOfPromise;

					//Assert
					const decodedBalanceOfResult = await balanceOfResult.decode("int");
					assert.equal(decodedBalanceOfResult.value, expectedBalance)
				})

				it('shouldn`t burn token from non-owner', async () => {
					//Arrange

					//Act
					const unauthorizedBurnPromise = secondClient.contractCall(compiledContract.bytecode, config.abiType, deployedContract.address, nonFungibleFunctions.BURN, {
						args: `(${firstTokenId})`,
						options: {
							ttl: config.ttl
						}
					})

					//Assert
					await assert.isRejected(unauthorizedBurnPromise, errorMessages.ONLY_OWNER_CAN_TRANSFER);
				})
			})

			describe('Transfer', () => {
				it('should transfer token successfully', async () => {
					//Arrange
					const expectedBalanceOfNotOwner = 1;
					const expectedBalanceOfOwner = 0;

					//Act
					const setApprovalForAllPromise = deployedContract.call(nonFungibleFunctions.SET_APPROVAL_FOR_ALL, {
						args: `(${ownerPublicKeyAsHex},${true})`,
						options: {
							ttl: config.ttl
						}
					});
					
					await setApprovalForAllPromise;

					const approvePromise = deployedContract.call(nonFungibleFunctions.APPROVE, {
						args: `(${firstTokenId}, ${notOwnerPublicKeyAsHex})`,
						options: {
							ttl: config.ttl
						}
					});
					
					await approvePromise;

					const transferFromPromise = deployedContract.call(nonFungibleFunctions.TRANSFER_FROM, {
						args: `(${ownerPublicKeyAsHex}, ${notOwnerPublicKeyAsHex}, ${firstTokenId})`,
						options: {
							ttl: config.ttl
						}
					});
					
					await transferFromPromise;

					const balanceOfNotOwnerPromise = deployedContract.call(nonFungibleFunctions.BALANCE_OF, {
						args: `(${notOwnerPublicKeyAsHex})`,
						options: {
							ttl: config.ttl
						}
					});
					
					const balanceOfNotOwnerResult = await balanceOfNotOwnerPromise;

					const balanceOwnerPromise = deployedContract.call(nonFungibleFunctions.BALANCE_OF, {
						args: `(${ownerPublicKeyAsHex})`,
						options: {
							ttl: config.ttl
						}
					});
					
					const balanceOfOwnerResult = await balanceOwnerPromise;

					const ownerOfPromise = deployedContract.call(nonFungibleFunctions.OWNER_OF, {
						args: `(${firstTokenId})`,
						options: {
							ttl: config.ttl
						}
					});
					
					const ownerOfResult = await ownerOfPromise;

					// //Assert
					const decodedBalanceOfNotOwnerResult = await balanceOfNotOwnerResult.decode("int");
					const decodedBalanceOfOwnerResult = await balanceOfOwnerResult.decode("int");
					const publicKey = await getAddress(ownerOfResult);

					assert.equal(decodedBalanceOfNotOwnerResult.value, expectedBalanceOfNotOwner)
					assert.equal(decodedBalanceOfOwnerResult.value, expectedBalanceOfOwner)
					assert.equal(publicKey, config.notOwnerKeyPair.publicKey)
				})

				it('non-owner of token shouldn`t be able to call approve', async () => {
					//Arrange

					//Act
					const unauthorizedApprovePromise = secondClient.contractCall(compiledContract.bytecode, config.abiType, deployedContract.address, nonFungibleFunctions.APPROVE, {
						args: `(${firstTokenId}, ${ownerPublicKeyAsHex})`,
						options: {
							ttl: config.ttl
						}
					})

					//Assert
					await assert.isRejected(unauthorizedApprovePromise, errorMessages.NOT_AN_OWNER_OR_NOT_APPROVED);
				})

				it('non-owner of token shouldn`t be able to call transferFrom', async () => {
					//Arrange

					//Act
					const unauthorizedTransferPromise = secondClient.contractCall(compiledContract.bytecode, config.abiType, deployedContract.address, nonFungibleFunctions.TRANSFER_FROM, {
						args: `(${notOwnerPublicKeyAsHex}, ${ownerPublicKeyAsHex}, ${firstTokenId})`,
						options: {
							ttl: config.ttl
						}
					})

					//Assert
					await assert.isRejected(unauthorizedTransferPromise, errorMessages.NOT_AN_OWNER_OR_NOT_APPROVED);
				})
			})

			describe('Metadata', () => {	
				it('should write/read token metadata successfully', async () => {	
					//Arrange	
					const expectedTokenURI = "Token";	

					//Act	
					await deployedContract.call(nonFungibleFunctions.SET_TOKEN_URI, { 
						args: `(${firstTokenId}, "Token")`, 
						options: { 
							ttl: config.ttl 
						}});

					const tokenURIPromise = deployedContract.call(nonFungibleFunctions.GET_TOKEN_URI, { 
						args: `(${firstTokenId})`, 
						options: { ttl: config.ttl
						}});

					const tokenURIResult = await tokenURIPromise;	

					//Assert	
					const decodedTokenURIResult = await tokenURIResult.decode("string");	

					assert.equal(decodedTokenURIResult.value, expectedTokenURI)	
				})	
			})
		})
	})
})