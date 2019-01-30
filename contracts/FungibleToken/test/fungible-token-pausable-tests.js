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
			networkId: 'ae_devnet'
		});

		secondClient = await Universal({
			url: config.host,
			internalUrl: config.internalHost,
			keypair: config.notOwnerKeyPair,
			nativeMode: true,
			networkId: 'ae_devnet'
		});

		firstClient.setKeypair(config.ownerKeyPair)
		await firstClient.spend(1, config.notOwnerKeyPair.publicKey)

		contentOfContract = utils.readFileRelative(path.resolve(__dirname, contractFilePath), config.filesEncoding);
	})

	describe('Deploy contract', () => {

		it('deploying successfully', async () => {
			//Arrange
			const compiledContract = await firstClient.contractCompile(contentOfContract, {})

			//Act
			const deployPromise = compiledContract.deploy({
				options: {
					ttl: config.ttl
				},
				abi: "sophia"
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
				abi: "sophia"
			});
		})

		describe('Contract functionality', () => {
			beforeEach(async () => {
				const mintPromise = deployedContract.call('mint', {
					args: `(${config.pubKeyHex}, 1000)`,
					options: {
						ttl: config.ttl
					},
					abi: "sophia"
				})
				
				await mintPromise;
			})

			describe('Pause', () => {
				it('should pause contract successfully', async () => {
					//Arrange
					const expectedValue = true;

					//Act
					const pausePromise = deployedContract.call('pause', {
						options: {
							ttl: config.ttl
						}
					});
					
					await pausePromise;

					const pausedPromise = deployedContract.call('paused', {
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
					const unauthorisedPromise = secondClient.contractCall(compiledContract.bytecode, 'sophia', deployedContract.address, "pause", {
						options: {
							ttl: config.ttl
						}
					})

					await assert.isRejected(unauthorisedPromise, errorMessages.ONLY_OWNER_CAN_MINT);
				})

				it('shouldn`t mint when contract is paused', async () => {

					//Act
					const pausePromise = deployedContract.call('pause', {
						options: {
							ttl: config.ttl
						}
					});
					
					await pausePromise;

					const mintPromise = deployedContract.call('mint', {
						args: `(${config.pubKeyHex}, 1)`,
						options: {
							ttl: config.ttl
						},
						abi: "sophia"
					})

					//Assert
					await assert.isRejected(mintPromise, errorMessages.CONTRACT_IS_PAUSED);
				})

				it('shouldn`t burn when contract is paused', async () => {
					//Arrange
					const burnAmount = 10;

					//Act
					const pausePromise = deployedContract.call('pause', {
						options: {
							ttl: config.ttl
						}
					});
					
					await pausePromise;

					const burnPromise = deployedContract.call('burn', {
						args: `(${burnAmount})`,
						options: {
							ttl: config.ttl
						},
						abi: "sophia"
					})

					//Assert
					await assert.isRejected(burnPromise, errorMessages.CONTRACT_IS_PAUSED);
				})

				it('shouldn`t approve when contract is paused', async () => {
					//Arrange
					const transferAmount = 10;

					//Act
					const pausePromise = deployedContract.call('pause', {
						options: {
							ttl: config.ttl
						}
					});
					
					await pausePromise;

					const approvePromise = deployedContract.call('approve', {
						args: `(${config.notOwnerPubKeyHex}, ${transferAmount})`,
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
					const approvePromise = deployedContract.call('approve', {
						args: `(${config.notOwnerPubKeyHex}, ${transferAmount})`,
						options: {
							ttl: config.ttl
						}
					});
					
					await approvePromise;

					const pausePromise = deployedContract.call('pause', {
						options: {
							ttl: config.ttl
						}
					});
					
					await pausePromise;

					const transferFromPromise = secondClient.contractCall(compiledContract.bytecode, 'sophia', deployedContract.address, "transferFrom", {
						args: `(${config.pubKeyHex}, ${config.notOwnerPubKeyHex}, ${transferAmount})`,
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