const chai = require('chai');
let chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const assert = chai.assert;
const utils = require('./../utils/utils');
const AeSDK = require('@aeternity/aepp-sdk');
const Universal = AeSDK.Universal;
const config = require("./constants/config.json");
const contractFilePath = "./../contracts/fungible-token-capped.aes";

const path = require('path');
const errorMessages = require('./constants/error-messages.json');

const fungibleTokenFunctions = require('./constants/fungible-token-functions'); 

const ownerPublicKeyAsHex = utils.publicKeyToHex(config.ownerKeyPair.publicKey);

describe('Fungible Capped Token', () => {

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
			const cap = 100;
			const compiledContract = await firstClient.contractCompile(contentOfContract, {})

			//Act
			const deployPromise = compiledContract.deploy({
				initState: `(${cap})`,
				options: {
					ttl: config.ttl,
				},
				abi: config.abiType
			});
			
			const deployedContract = await deployPromise;

			const capPromise = deployedContract.call(fungibleTokenFunctions.CAP, {
				options: {
					ttl: config.ttl,
				}
			});
			
			const capPromiseResult = await capPromise;

			//Assert
			const decodedCapPromiseResult = await capPromiseResult.decode("int");

			assert.equal(config.ownerKeyPair.publicKey, deployedContract.owner);
			assert.equal(decodedCapPromiseResult.value, cap);
		})
	})

	describe('Contract functionality', () => {

		it('shoulnd`t mint over cap limit', async () => {
			//Arrange
			const cap = 100;
			const compiledContract = await firstClient.contractCompile(contentOfContract, {})

			//Act
			const deployPromise = compiledContract.deploy({
				initState: `(${cap})`,
				options: {
					ttl: config.ttl,
				},
				abi: config.abiType
			});

			const deployedContract = await deployPromise;

			const mintPromise = deployedContract.call(fungibleTokenFunctions.MINT, {
				args: `(${ownerPublicKeyAsHex}, 1000)`,
				options: {
					ttl: config.ttl,
				},
				abi: config.abiType
			})

			//Assert
			await assert.isRejected(mintPromise, errorMessages.EXCEEDS_CAP);
		})
	})
})