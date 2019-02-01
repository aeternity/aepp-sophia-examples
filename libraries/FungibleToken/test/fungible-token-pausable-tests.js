const chai = require('chai');
let chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const assert = chai.assert;
const utils = require('./../utils/utils');
const AeSDK = require('@aeternity/aepp-sdk');
const Universal = AeSDK.Universal;
const config = require("./constants/config.json");
const contractFilePath = "./../contracts/fungible-token-pausable.aes";

const path = require('path');
const errorMessages = require('./constants/error-messages.json');

const ownerPublicKeyAsHex = utils.publicKeyToHex(config.ownerKeyPair.publicKey);
const notOwnerPublicKeyAsHex = utils.publicKeyToHex(config.notOwnerKeyPair.publicKey);

const fungibleTokenFunctions = require('./constants/fungible-token-functions');

describe('Fungible Pauseable Token', () => {

	let firstClient;
	let secondClient;
	let contentOfContract;

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
		await firstClient.spend(1, config.notOwnerKeyPair.publicKey);

		contentOfContract = utils.readFileRelative(path.resolve(__dirname, contractFilePath), config.filesEncoding);
	})

	describe('Deploy contract', () => {

		it('deploying successfully ', async () => {
			//Arrange
			const compiledContract = await firstClient.contractCompile(contentOfContract, {})

			//Act
			const deployPromise = compiledContract.deploy({
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
			compiledContract = await firstClient.contractCompile(contentOfContract, {})
			deployedContract = await compiledContract.deploy({
				options: {
					ttl: config.ttl
				},
				abi: config.abiType
			});
		})

		describe('Contract functionality', () => {
			beforeEach(async () => {
				const mintPromise = deployedContract.call(fungibleTokenFunctions.MINT, {
					args: `(${ownerPublicKeyAsHex}, 1000)`,
					options: {
						ttl: config.ttl
					},
					abi: config.abiType
				})
				
				await mintPromise;
			})

			describe('Pause', () => {
				it('should pause contract successfully', async () => {
					//Arrange
					const expectedValue = true;

					//Act
					const pausePromise = deployedContract.call(fungibleTokenFunctions.PAUSE, {
						options: {
							ttl: config.ttl
						}
					});
					
					await pausePromise;

					const pausedPromise = deployedContract.call(fungibleTokenFunctions.PAUSED, {
						options: {
							ttl: config.ttl
						}
					});
					
					const pausedPromiseResult = await pausedPromise;

					//Assert
					const pausedResult = await pausedPromiseResult.decode("bool");
					assert.equal(pausedResult.value, expectedValue)
				})

				it('should not pause contract from non-owner', async () => {
					const unauthorisedPromise = secondClient.contractCall(compiledContract.bytecode, config.abiType, deployedContract.address, fungibleTokenFunctions.PAUSE, {
						options: {
							ttl: config.ttl
						}
					})

					await assert.isRejected(unauthorisedPromise, errorMessages.ONLY_OWNER_CAN_MINT);
				})

				it('shouldn`t mint when contract is paused', async () => {

					//Act
					const pausePromise = deployedContract.call(fungibleTokenFunctions.PAUSE, {
						options: {
							ttl: config.ttl
						}
					});
					
					await pausePromise;

					const mintPromise = deployedContract.call(fungibleTokenFunctions.MINT, {
						args: `(${ownerPublicKeyAsHex}, 1)`,
						options: {
							ttl: config.ttl
						},
						abi: config.abiType
					})

					//Assert
					await assert.isRejected(mintPromise, errorMessages.CONTRACT_IS_PAUSED);
				})

				it('shouldn`t burn when contract is paused', async () => {
					//Arrange
					const burnAmount = 10;

					//Act
					const pausePromise = deployedContract.call(fungibleTokenFunctions.PAUSE, {
						options: {
							ttl: config.ttl
						}
					});
					
					await pausePromise;

					const burnPromise = deployedContract.call(fungibleTokenFunctions.BURN, {
						args: `(${burnAmount})`,
						options: {
							ttl: config.ttl
						},
						abi: config.abiType
					})

					//Assert
					await assert.isRejected(burnPromise, errorMessages.CONTRACT_IS_PAUSED);
				})

				it('shouldn`t approve when contract is paused', async () => {
					//Arrange
					const transferAmount = 10;

					//Act
					const pausePromise = deployedContract.call(fungibleTokenFunctions.PAUSE, {
						options: {
							ttl: config.ttl
						}
					});
					
					await pausePromise;

					const approvePromise = deployedContract.call(fungibleTokenFunctions.APPROVE, {
						args: `(${notOwnerPublicKeyAsHex}, ${transferAmount})`,
						options: {
							ttl: config.ttl
						}
					});

					//Assert
					await assert.isRejected(approvePromise, errorMessages.CONTRACT_IS_PAUSED);
				})

				it('shouldn`t transfer when contract is paused with already approved coins', async () => {
					//Arrange
					const transferAmount = 10;

					//Act
					const approvePromise = deployedContract.call(fungibleTokenFunctions.APPROVE, {
						args: `(${notOwnerPublicKeyAsHex}, ${transferAmount})`,
						options: {
							ttl: config.ttl
						}
					});
					
					await approvePromise;

					const pausePromise = deployedContract.call(fungibleTokenFunctions.PAUSE, {
						options: {
							ttl: config.ttl
						}
					});
					
					await pausePromise;

					const transferFromPromise = secondClient.contractCall(compiledContract.bytecode, config.abiType, deployedContract.address, fungibleTokenFunctions.TRANSFER_FROM, {
						args: `(${ownerPublicKeyAsHex}, ${notOwnerPublicKeyAsHex}, ${transferAmount})`,
						options: {
							ttl: config.ttl
						}
					})

					//Assert
					await assert.isRejected(transferFromPromise, errorMessages.CONTRACT_IS_PAUSED);
				})
			})
		})
	})
})