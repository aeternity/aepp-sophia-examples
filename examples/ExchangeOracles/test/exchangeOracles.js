const chai = require('chai');
let chaiAsPromised = require("chai-as-promised");
const AeSDK = require('@aeternity/aepp-sdk');
const utils = require('../utils/utils');
const config = require('./config.json')
const oracleSourceFile = './contracts/ExchangeOracle.aes';
const marketSourceFile = './contracts/ExchangeMarket.aes';
const bytes = require('@aeternity/aepp-sdk/es/utils/bytes');
const BigNumber = require('bignumber.js');
const Universal = AeSDK.Universal;
const crypto = AeSDK.Crypto;
const assert = chai.assert;
chai.use(chaiAsPromised);
const ttl = 100
const qfee = 10
const _aePrice = 1000
const _tokenPrice = 1500
const _updatedAePrice = 2000
const _updatedTokenPrice = 2000
const _zeroPrice = 0


describe('ExchangeOracle', () => {

	let firstClient;
	let secondClient;
	let oracleSource;
	let marketSource;


	before(async () => {

		//Test net configuration
		firstClient = await Universal({
			url: "https://sdk-testnet.aepps.com",
			internalUrl: "https://sdk-testnet.aepps.com",
			keypair: config.ownerKeyPairTest,
			nativeMode: true,
			networkId: 'ae_uat'
		});
		secondClient = await Universal({
			url: "https://sdk-testnet.aepps.com",
			internalUrl: "https://sdk-testnet.aepps.com",
			keypair: config.notOwnerKeyPair,
			nativeMode: true,
			networkId: 'ae_uat'
		});


		//Local node configuration
		// firstClient = await Universal({
		// 	url: config.host,
		// 	internalUrl: config.internalHost,
		// 	keypair: config.ownerKeyPair,
		// 	nativeMode: true,
		// 	networkId: 'ae_devnet'
		// });
		// secondClient = await Universal({
		// 	url: config.host,
		// 	internalUrl: config.internalHost,
		// 	keypair: config.notOwnerKeyPair,
		// 	nativeMode: true,
		// 	networkId: 'ae_devnet'
		// });


		firstClient.setKeypair(config.ownerKeyPair)
		await firstClient.spend(1, config.notOwnerKeyPair.publicKey)

		oracleSource = utils.readFileRelative(oracleSourceFile, config.filesEncoding);
		marketSource = utils.readFileRelative(marketSourceFile, config.filesEncoding);

	})

	xit('deploying oracle successfully', async () => {
		//Arrange
		const compiledContract = await firstClient.contractCompile(oracleSource, {})

		//Act
		const deployedContract = await compiledContract.deploy({
			initState: `(${qfee}, ${ttl})`,
			options: {
				ttl: config.ttl,

				verify: true
			}
		});

		//Assert
		assert.equal(config.ownerKeyPair.publicKey, deployedContract.owner)
	})

	xit('deploying market successfully', async () => {
		//Arrange
		const compiledContract = await firstClient.contractCompile(marketSource, {
			gas: config.gas
		})

		//Act
		const deployedContract = await compiledContract.deploy({
			initState: `(${_aePrice}, ${_tokenPrice})`,
			options: {
				ttl: config.ttl,
				verify: true
			}
		});

		//Assert
		assert.equal(config.ownerKeyPair.publicKey, deployedContract.owner)
	})


	xit('should throw when trying to deploy oracle with zero qfee', async () => {
		//Arrange
		const compiledContract = await firstClient.contractCompile(oracleSource, {})

		//Act
		const deployedContract = await compiledContract.deploy({
			initState: `(${0}, ${ttl})`,
			options: {
				ttl: config.ttl
			}
		});

		//Assert
		assert.isRejected(deployedContract, 0, "Deploying oracle contract without zero qfee succeeded")
	})

	xit('should throw when trying to deploy oracle with zero ttl', async () => {
		//Arrange
		const compiledContract = await firstClient.contractCompile(oracleSource, {})

		//Act
		const deployedContract = await compiledContract.deploy({
			initState: `(${0}, ${0})`,
			options: {
				ttl: config.ttl
			}
		});

		//Assert
		console.log(deployedContract.owner, "TEST")
		// assert.isRejected(deployedContract, 0, "Deploying oracle contract without zero ttl succeeded")

	})



	describe('Oracle smart contract tests', () => {

		let deployedOracleContract;
		let compiledOracleContract;

		beforeEach(async () => {
			compiledOracleContract = await firstClient.contractCompile(oracleSource, {})


			deployedOracleContract = await compiledOracleContract.deploy({
				initState: `(${qfee}, ${ttl})`,
				options: {
					ttl: config.ttl,
					amount: 100000,
					deposit: 100000
				},
				abi: "sophia"
			});


		})

		it('should register an oracle successfully  ', async () => {
			console.log(deployedOracleContract)
			let oracleAddress = await firstClient.contractCallStatic(deployedOracleContract.address, 'sophia-address', 'getOracle', {})
			let oralceData = await oracleAddress.decode('int')
			assert.notEqual(oralceData.value, "", 'Registering the oracle has failed');


		})

		it('should make a query from the oracle contract', async () => {
			let string = "aePrice"
			let queryTtl = 50
			let queryFee = 20

			let createQueryPromise = await deployedOracleContract.call('createQuery', {
				args: `("${string}", ${queryFee}, ${queryTtl}, ${queryTtl})`,
				options: {
					ttl: config.ttl,
					verify: true
				},
				abi: "sophia"
			});

			let queryData = await createQueryPromise.decode('int')
			assert.notEqual(queryData.value, "", 'Querying the oracle has failed');

		})

		it('should get the question from the oracle', async () => {

			let question = "aePrice"
			let queryTtl = 50
			let queryFee = 20

			let createQueryPromise = await deployedOracleContract.call('createQuery', {
				args: `("${question}", ${queryFee}, ${queryTtl}, ${queryTtl})`,
				options: {
					ttl: config.ttl
				},
				abi: "sophia"
			});
			let queryData = await createQueryPromise.decode('int')

			let getQuestionData = await deployedOracleContract.call('getQuestion', {
				args: `(${queryData.value})`,
				options: {
					ttl: config.ttl
				},
				abi: "sophia"
			});

			let questionData = await getQuestionData.decode('string')
			assert.strictEqual(questionData.value, question, "The returned question is not correct")
		})

		it("should respond to question", async () => {
			let string = "aePrice"
			let queryTtl = 50
			let queryFee = 20
			let answer = 100

			let createQueryPromise = await deployedOracleContract.call('createQuery', {
				args: `("${string}", ${queryFee}, ${queryTtl}, ${queryTtl})`,
				options: {
					ttl: config.ttl
				},
				abi: "sophia"
			});

			let queryData = await createQueryPromise.decode('int')

			let respondToQuestionPromise = deployedOracleContract.call('respondToQuestion', {
				args: `(${queryData.value}, ${answer})`,
				options: {
					ttl: config.ttl
				},
				abi: "sophia"
			});

			assert.isFulfilled(respondToQuestionPromise, "The response is not working")
			await respondToQuestionPromise;
		})

		it('should make a query from the oracle contract', async () => {
			let string = "aePrice"
			let queryTtl = 50
			let queryFee = 20

			let createQueryPromise = await deployedOracleContract.call('createQuery', {
				args: `("${string}", ${queryFee}, ${queryTtl}, ${queryTtl})`,
				options: {
					ttl: config.ttl
				},
				abi: "sophia"
			});

			let queryData = await createQueryPromise.decode('int')
			assert.notEqual(queryData.value, "", 'Querying the oracle has failed');

		})


	})

	xdescribe('Market smart contract tests', () => {

		let deployedOracleContract;
		let compiledOracleContract;
		let deployedMarketContract;
		let compiledMarketContract;

		beforeEach(async () => {
			compiledOracleContract = await firstClient.contractCompile(oracleSource, {})


			deployedOracleContract = await compiledOracleContract.deploy({
				initState: `(${qfee}, ${ttl})`,
				options: {
					ttl: config.ttl,
					amount: 100000,
					deposit: 100000
				},
				abi: "sophia"
			});
			compiledMarketContract = await firstClient.contractCompile(marketSource, {})

			deployedMarketContract = await compiledMarketContract.deploy({
				initState: `(${_aePrice}, ${_tokenPrice})`,
				options: {
					ttl: config.ttl,
					deposit: 100000,
					amount: 100000
				},
				abi: "sophia"
			});
		})
		it("should get the query_fee", async () => {

			const oracleData = await firstClient.contractCallStatic(deployedOracleContract.address, 'sophia-address', 'getOracle', {})
			let oracleID = await oracleData.decode('int')

			const getQueryFeePromise = await deployedMarketContract.call('queryFee', {
				args: `(${oracleID.value})`,
				options: {
					ttl: config.ttl
				},
				abi: "sophia"
			});
			let decodedResult = await getQueryFeePromise.decode("int")
			assert.equal(decodedResult.value, qfee, "The query fee is not correct")
		})

		it("should update the ae price", async () => {

			const updatingAePricePromise = await deployedMarketContract.call('updateAePrice', {
				args: `(${_updatedAePrice})`,
				options: {
					ttl: config.ttl
				},
				abi: "sophia"
			});


			const getAePricePromise = await deployedMarketContract.call('getAePrice', {
				options: {
					ttl: config.ttl
				},
				abi: "sophia"
			});
			let aepPriceData = await firstClient.contractCallStatic(deployedMarketContract.address, 'sophia-address', 'getAePrice', {})
			let finalAePrice = await aepPriceData.decode("int")

			assert.equal(finalAePrice.value, _updatedAePrice, "Ae price was not updated properly")

		})

		it("should update the token price", async () => {


			const updatingTokenPricePromise = await deployedMarketContract.call('updateTokenPrice', {
				args: `(${_updatedTokenPrice})`,
				options: {
					ttl: config.ttl
				},
				abi: "sophia"
			});

			const getTokenPricePromise = await deployedMarketContract.call('getTokenPrice', {
				options: {
					ttl: config.ttl
				},
				abi: "sophia"
			});

			let finalTokenPrice = await getTokenPricePromise.decode("int")
			assert.equal(finalTokenPrice.value, _updatedTokenPrice, "Token price was not updated properly")

		})

		it("should throw if the new ae price is not greater than zero", async () => {

			const updatingAePricePromise = deployedMarketContract.call('updateAePrice', {
				args: `(${_zeroPrice})`,
				options: {
					ttl: config.ttl
				},
				abi: "sophia"
			});

			await assert.isRejected(updatingAePricePromise, "_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAI1RoZSBwcmljZSBtdXN0IGJlIGdyZWF0ZXIgdGhhbiB6ZXJvAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACO03Cq", "Update price not failing with zero value")

		})

		it("should throw if the new token price is not greater than zero", async () => {

			const updatingAePricePromise = deployedMarketContract.call('updateTokenPrice', {
				args: `(${_zeroPrice})`,
				options: {
					ttl: config.ttl
				},
				abi: "sophia"
			});

			await assert.isRejected(updatingAePricePromise, "_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAI1RoZSBwcmljZSBtdXN0IGJlIGdyZWF0ZXIgdGhhbiB6ZXJvAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACO03Cq", "Update price not failing with zero value")

		})
	})



})