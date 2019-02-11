const chai = require('chai');
let chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const assert = chai.assert;
const AeSDK = require('@aeternity/aepp-sdk');
const bytes = require('@aeternity/aepp-sdk/es/utils/bytes');
const Universal = AeSDK.Universal;
const crypto = AeSDK.Crypto;

const utils = require('./../utils/utils');
const config = require('./constants/config.json');
const sourceFile = './contracts/Ownable.aes';

const errorMessages = require('./constants/error-messages.json');

const notOwnerPublicKeyAsHex = utils.publicKeyToHex(config.notOwnerKeyPair.publicKey);

const ownableFunctions = require('./constants/smartContractFunctions.json')

describe('Ownable', () => {

	let firstClient;
	let secondClient;
	let ownableSource;


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

		ownableSource = utils.readFileRelative(sourceFile, config.filesEncoding);
	})

	describe('Deploy contract', () => {

		it('deploying successfully', async () => {
			//Arrange
			const compiledContract = await firstClient.contractCompile(ownableSource, {
				gas: config.gas
			})

			//Act
			const deployPromise = compiledContract.deploy({
				options: {
					ttl: config.ttl,
				}
			});

			//Assert
			const deployedContract = await deployPromise;
			assert.equal(config.ownerKeyPair.publicKey, deployedContract.owner)
		})
	})

	describe('Smart contract tests', () => {

		let deployedContract;
		let compiledContract;

		beforeEach(async () => {
			compiledContract = await firstClient.contractCompile(ownableSource, {
				gas: config.gas
			})

			deployedContract = await compiledContract.deploy({
				options: {
					ttl: config.ttl
				},
				abi: config.abiType
			});
		})

		it('should set the proper owner to the smart contract', async () => {

			const callOwnerPromise = deployedContract.call(ownableFunctions.OWNER, {
				options: {
					ttl: config.ttl
				},
				abi: config.abiType
			});

			const callOwnerResult = await callOwnerPromise;
			let encodedData = await callOwnerResult.decode('address')
			const ownerPublicKey = crypto.aeEncodeKey(bytes.toBytes(encodedData.value, true))

			assert.equal(ownerPublicKey, config.ownerKeyPair.publicKey)

		})

		it('should return true if owner calls onlyOwner', async () => {
			const callOnlyOwnerPromise = deployedContract.call(ownableFunctions.ONLY_OWNER, {
				options: {
					ttl: config.ttl
				},
				abi: config.abiType
			});

			const callOnlyOwnerResult = await callOnlyOwnerPromise;
			const decodedData = await callOnlyOwnerResult.decode('bool')

			assert.equal(decodedData.value, 1, 'The owner is different from the caller')
		})

		it('should return true if the caller is the owner, check function', async () => {

			const callIsOwnerPromise = deployedContract.call(ownableFunctions.IS_OWNER, {
				options: {
					ttl: config.ttl
				},
				abi: config.abiType
			});
			
			const callIsOwnerResult = await callIsOwnerPromise;
			const decodedData = await callIsOwnerResult.decode('bool')

			assert.equal(decodedData.value, 1, 'The owner is different from the caller')
		})

		it('should change the owner to #0 address', async () => {

			const callRenounceOwnershipPromise = deployedContract.call(ownableFunctions.RENOUNCE_OWNERSHIP, {
				options: {
					ttl: config.ttl
				},
				abi: config.abiType
			});
			
			const callRenounceOwnershipResult = await callRenounceOwnershipPromise;

			let encodedData = await callRenounceOwnershipResult.decode('address')
			assert.equal(encodedData.value, 0, 'The owner is different from the caller')

		})

		it('should transfer ownership of the contract', async () => {

			const callTransferOwnershipPromise = deployedContract.call(ownableFunctions.TRANSFER_OWNERSHIP, {
				args: `(${notOwnerPublicKeyAsHex})`,
				options: {
					ttl: config.ttl
				},
				abi: config.abiType
			})
			await assert.isFulfilled(callTransferOwnershipPromise, 'Calling transfer ownership function failed');

			const callOwnerPromise = deployedContract.call(ownableFunctions.OWNER, {
				options: {
					ttl: config.ttl
				},
				abi: config.abiType
			});

			const callOwnerResult = await callOwnerPromise;
			let encodedData = await callOwnerResult.decode('address')
			const ownerPublicKey = crypto.aeEncodeKey(bytes.toBytes(encodedData.value, true))
			
			assert.equal(ownerPublicKey, config.notOwnerKeyPair.publicKey)
		})

		it('should throw if not owner call function onlyOwner', async () => {
			const unauthorizedOnlyOwnerPromise = secondClient.contractCall(compiledContract.bytecode, 'sophia', deployedContract.address, ownableFunctions.ONLY_OWNER, {
				options: {
					ttl: config.ttl
				},
				abi: config.abiType
			})

			await assert.isRejected(unauthorizedOnlyOwnerPromise, errorMessages.NOT_AN_OWNER);
		})

		it('should throw if not owner tries to renounce ownership', async () => {
			const unauthorizedRenounceOwnershipPromise = secondClient.contractCall(compiledContract.bytecode, 'sophia', deployedContract.address, ownableFunctions.RENOUNCE_OWNERSHIP, {
				options: {
					ttl: config.ttl
				},
				abi: config.abiType
			})

			await assert.isRejected(unauthorizedRenounceOwnershipPromise, errorMessages.NOT_AN_OWNER)

			const callOwnerPromise = deployedContract.call(ownableFunctions.OWNER, {
				options: {
					ttl: config.ttl
				},
				abi: config.abiType
			});
			
			const callOwnerResult = await callOwnerPromise;
			let encodedData = await callOwnerResult.decode('address')
			const ownerPublicKey = crypto.aeEncodeKey(bytes.toBytes(encodedData.value, true))

			assert.equal(ownerPublicKey, config.ownerKeyPair.publicKey)
		})

		it('should throw if not owner tries to change the ownership of the contract', async () => {
			const unauthorizedTransferOwnershipPromise = secondClient.contractCall(compiledContract.bytecode, 'sophia', deployedContract.address, ownableFunctions.TRANSFER_OWNERSHIP, {
				args: `(${notOwnerPublicKeyAsHex})`,
				options: {
					ttl: config.ttl
				},
				abi: config.abiType
			})

			await assert.isRejected(unauthorizedTransferOwnershipPromise, errorMessages.NOT_AN_OWNER)
			const callOwnerPromise = deployedContract.call(ownableFunctions.OWNER, {
				options: {
					ttl: config.ttl
				},
				abi: config.abiType
			});
			
			const callOwnerResult = await callOwnerPromise;
			let encodedData = await callOwnerResult.decode('address')
			const ownerPublicKey = crypto.aeEncodeKey(bytes.toBytes(encodedData.value, true))

			assert.equal(ownerPublicKey, config.ownerKeyPair.publicKey)
		})
	})
})