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
const ttl = 1000
const qfee = 50
const _aePrice = 100
const _tokenPrice = 150
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
		// firstClient = await Universal({
		// 	url: "https://sdk-testnet.aepps.com",
		// 	internalUrl: "https://sdk-testnet.aepps.com",
		// 	keypair: config.ownerKeyPairTest,
		// 	nativeMode: true,
		// 	networkId: 'ae_uat'
		// });
		// secondClient = await Universal({
		// 	url: "https://sdk-testnet.aepps.com",
		// 	internalUrl: "https://sdk-testnet.aepps.com",
		// 	keypair: config.notOwnerKeyPair,
		// 	nativeMode: true,
		// 	networkId: 'ae_uat'
		// });


		//Local node configuration
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

		await firstClient.spend(1, config.notOwnerKeyPair.publicKey)

		oracleSource = utils.readFileRelative(oracleSourceFile, config.filesEncoding);
		marketSource = utils.readFileRelative(marketSourceFile, config.filesEncoding);

	})

	it('deploying oracle successfully', async () => {
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
		let ownerAddress = await firstClient.address();
		assert.equal(ownerAddress, deployedContract.owner)
	})

	it('deploying market successfully', async () => {
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
		let ownerAddress = await firstClient.address();
		assert.equal(ownerAddress, deployedContract.owner)
	})

	it('should throw when deploying oracle contract with zero qfee', async () => {
		const compiledContract = await firstClient.contractCompile(oracleSource, {})

		//Act
		const deployedContract = await compiledContract.deploy({
			initState: `(${0}, ${ttl})`,
			options: {
				ttl: config.ttl,
				verify: true
			}
		});

		//Assert
		const result = await firstClient.getTxInfo(deployedContract.transaction)
		assert.equal(result.returnType, "revert")
	})

	it('should throw when deploying oracle contract with zero ttl', async () => {
		const compiledContract = await firstClient.contractCompile(oracleSource, {})

		//Act
		const deployedContract = await compiledContract.deploy({
			initState: `(${qfee}, ${0})`,
			options: {
				ttl: config.ttl,
				verify: true
			}
		});

		//Assert
		const result = await firstClient.getTxInfo(deployedContract.transaction)
		assert.equal(result.returnType, "revert")
	})
	it('should throw when deploying market contract with zero ae price', async () => {
		//Arrange
		const compiledContract = await firstClient.contractCompile(marketSource, {
			gas: config.gas
		})

		//Act
		const deployedContract = await compiledContract.deploy({
			initState: `(${0}, ${_tokenPrice})`,
			options: {
				ttl: config.ttl,
				verify: true
			}
		});

		//Assert
		const result = await firstClient.getTxInfo(deployedContract.transaction)
		assert.equal(result.returnType, "revert")
	})

	it('should throw when deploying market contract with zero token price', async () => {
		//Arrange
		const compiledContract = await firstClient.contractCompile(marketSource, {
			gas: config.gas
		})

		//Act
		const deployedContract = await compiledContract.deploy({
			initState: `(${_aePrice}, ${0})`,
			options: {
				ttl: config.ttl,
				verify: true
			}
		});

		//Assert
		const result = await firstClient.getTxInfo(deployedContract.transaction)
		assert.equal(result.returnType, "revert")
	})

	describe('Oracle smart contract tests', () => {

		let deployedOracleContract;
		let compiledOracleContract;

		beforeEach(async () => {
			compiledOracleContract = await firstClient.contractCompile(oracleSource, {})


			deployedOracleContract = await compiledOracleContract.deploy({
				initState: `(${50}, ${500})`,
				options: {
					ttl: config.ttl,
					amount: 100000,
					deposit: 100000
				},
				abi: "sophia"
			});


		})

		it('should register an oracle successfully  ', async () => {
			let oracleAddress = await firstClient.contractCallStatic(deployedOracleContract.address, 'sophia-address', 'get_oracle', {})
			let oralceData = await oracleAddress.decode('int')
			assert.notEqual(oralceData.value, "", 'Registering the oracle has failed');


		})

		it('should make a query from the oracle contract', async () => {
			let string = "aePrice"
			let queryTtl = 50
			let queryFee = 70

			let createQueryPromise = await deployedOracleContract.call('create_query', {
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
			let queryFee = 70

			let createQueryPromise = await deployedOracleContract.call('create_query', {
				args: `("${question}", ${queryFee}, ${queryTtl}, ${queryTtl})`,
				options: {
					ttl: config.ttl
				},
				abi: "sophia"
			});
			let queryData = await createQueryPromise.decode('int')

			let getQuestionData = await deployedOracleContract.call('get_question', {
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
			let queryFee = 70
			let answer = 100

			let createQueryPromise = await deployedOracleContract.call('create_query', {
				args: `("${string}", ${queryFee}, ${queryTtl}, ${queryTtl})`,
				options: {
					ttl: config.ttl,
					verify: true
				},
				abi: "sophia"
			});

			let queryData = await createQueryPromise.decode('int')
			let respondToQuestionPromise

			respondToQuestionPromise = deployedOracleContract.call('respond_to_question', {
				args: `(${queryData.value}, ${answer})`,
				options: {
					ttl: config.ttl,
					verify: true,
					fee: 203418000000000000
				},
				abi: "sophia"
			});


			assert.isFulfilled(respondToQuestionPromise, "The response is not working")
			await respondToQuestionPromise
		})

		it('should make a query from the oracle contract', async () => {
			let string = "aePrice"
			let queryTtl = 50
			let queryFee = 70

			let createQueryPromise = await deployedOracleContract.call('create_query', {
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

	describe('Exchange Market smart contract tests', () => {

		let deployedOracleContract;
		let compiledOracleContract;
		let deployedMarketContract;
		let compiledMarketContract;
		let oracleId

		beforeEach(async () => {
			compiledOracleContract = await firstClient.contractCompile(oracleSource, {})


			deployedOracleContract = await compiledOracleContract.deploy({
				initState: `(${qfee}, ${ttl})`,
				options: {
					ttl: config.ttl,
					amount: 100000,
					deposit: 100000,
					verify: true
				},
				abi: "sophia"
			});
			compiledMarketContract = await firstClient.contractCompile(marketSource, {})

			deployedMarketContract = await compiledMarketContract.deploy({
				initState: `(${_aePrice}, ${_tokenPrice})`,
				options: {
					ttl: config.ttl,
					deposit: 100000,
					amount: 100000,
					verify: true
				},
				abi: "sophia"
			});

			let oracleAddress = await firstClient.contractCallStatic(deployedOracleContract.address, 'sophia-address', 'get_oracle', {})
			let oracleData = await oracleAddress.decode('int')
			oracleId = oracleData.value
		})
		it("should get the query_fee", async () => {

			const oracleData = await firstClient.contractCallStatic(deployedOracleContract.address, 'sophia-address', 'get_oracle', {})
			let oracleID = await oracleData.decode('int')

			const getQueryFeePromise = await deployedMarketContract.call('query_fee', {
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

			const updatingAePricePromise = await deployedMarketContract.call('update_price', {
				args: `(${_updatedAePrice}, "ae")`,
				options: {
					ttl: config.ttl
				},
				abi: "sophia"
			});

			let aepPriceData = await firstClient.contractCallStatic(deployedMarketContract.address, 'sophia-address', 'get_ae_price', {})

			let finalAePrice = await aepPriceData.decode("int")
			assert.equal(finalAePrice.value, _updatedAePrice, "Ae price was not updated properly")

		})

		it("should update the token price", async () => {

			const updatingTokenPricePromise = await deployedMarketContract.call('update_price', {
				args: `(${_updatedTokenPrice}, "token")`,
				options: {
					ttl: config.ttl
				},
				abi: "sophia"
			});

			const getTokenPricePromise = await deployedMarketContract.call('get_token_price', {
				options: {
					ttl: config.ttl
				},
				abi: "sophia"
			});

			let finalTokenPrice = await getTokenPricePromise.decode("int")
			assert.equal(finalTokenPrice.value, _updatedTokenPrice, "Token price was not updated properly")

		})

		it("should createa query from the market", async () => {

			let string = "aePrice"
			let queryTtl = 50
			let queryFee = 70

			let createQueryPromise = await deployedMarketContract.call('create_query', {
				args: `(${oracleId},"${string}", ${queryFee}, ${queryTtl}, ${queryTtl})`,
				options: {
					ttl: config.ttl,
					verify: true
				},
				abi: "sophia"
			});

			let queryData = await createQueryPromise.decode('int')
			assert.notEqual(queryData.value, "", 'Querying the oracle has failed');
		})

		it("should create query for AE Price from the market", async () => {

			let queryTtl = 50
			let queryFee = 70

			let createQueryPromise = await deployedMarketContract.call('create_ae_price_query', {
				args: `(${oracleId}, ${queryFee}, ${queryTtl}, ${queryTtl})`,
				options: {
					ttl: config.ttl,
					verify: true
				},
				abi: "sophia"
			});

			let queryData = await createQueryPromise.decode('int')
			assert.notEqual(queryData.value, "", 'Querying the oracle has failed');
		})
		it("should create query for Token price from the market", async () => {

			let queryTtl = 50
			let queryFee = 70

			let createQueryPromise = await deployedMarketContract.call('create_token_price_query', {
				args: `(${oracleId}, ${queryFee}, ${queryTtl}, ${queryTtl})`,
				options: {
					ttl: config.ttl,
					verify: true
				},
				abi: "sophia"
			});

			let queryData = await createQueryPromise.decode('int')
			assert.notEqual(queryData.value, "", 'Querying the oracle has failed');
		})

		it("should get the answer to a question", async () => {

			let string = "aePrice"
			let queryTtl = 50
			let queryFee = 70
			let answer = 100

			let createQueryPromise = await deployedOracleContract.call('create_query', {
				args: `("${string}", ${queryFee}, ${queryTtl}, ${queryTtl})`,
				options: {
					ttl: config.ttl,
					verify: true
				},
				abi: "sophia"
			});

			let queryData = await createQueryPromise.decode('int')

			let respondToQuestionPromise = await deployedOracleContract.call('respond_to_question', {
				args: `(${queryData.value}, ${answer})`,
				options: {
					ttl: config.ttl,
					verify: true,
					fee: 204418000000000000
				},
				abi: "sophia"
			});
			let getAnswerResult = await deployedMarketContract.call('get_answer', {
				args: `(${oracleId}, ${queryData.value})`,
				options: {
					ttl: config.ttl,
					fee: 204418000000000000,
					verify: true
				},
				abi: "sophia"
			});
			let answerData = await getAnswerResult.decode('int')
			assert.equal(answerData.value, answer, "The answer is not correct")

		})

		it("should throw if the new ae price is not greater than zero", async () => {

			const updatingAePricePromise = deployedMarketContract.call('update_price', {
				args: `(${_zeroPrice}, "ae")`,
				options: {
					ttl: config.ttl
				},
				abi: "sophia"
			});

			await assert.isRejected(updatingAePricePromise, "_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJ1RoZSBuZXcgcHJpY2UgbXVzdCBiZSBncmVhdGVyIHRoYW4gemVybwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACVNSAd", "Update price not failing with zero value")

		})

		it("should throw if the new token price is not greater than zero", async () => {

			const updatingAePricePromise = deployedMarketContract.call('update_price', {
				args: `(${_zeroPrice},"token")`,
				options: {
					ttl: config.ttl
				},
				abi: "sophia"
			});

			await assert.isRejected(updatingAePricePromise, "_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJ1RoZSBuZXcgcHJpY2UgbXVzdCBiZSBncmVhdGVyIHRoYW4gemVybwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACVNSAd", "Update price not failing with zero value")

		})

		it("should throw if asset is net recognized", async () => {

			const updatingAePricePromise = deployedMarketContract.call('update_price', {
				args: `(${_aePrice}, "test")`,
				options: {
					ttl: config.ttl
				},
				abi: "sophia"
			});

			await assert.isRejected(updatingAePricePromise, "_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAElVucmVjb2duaXplZCBhc3NldAAAAAAAAAAAAAAAAAAAq+UAtg==", "Update price not failing with zero value")

		})

		it("should throw when creating a query with 0 qfee", async () => {

			let string = "aePrice"
			let queryTtl = 50
			let queryFee = 0

			let createQueryPromise = deployedMarketContract.call('create_query', {
				args: `(${oracleId},"${string}", ${queryFee}, ${queryTtl}, ${queryTtl})`,
				options: {
					ttl: config.ttl,
					verify: true
				},
				abi: "sophia"
			});

			await assert.isRejected(createQueryPromise, "_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAI1F1ZXJ5IGZlZSBtdXN0IGJlIGdyZWF0ZXIgdGhhbiB6ZXJvAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABGMQUi", "Create Query not failing with zero value for qfee")
		})

		it("should throw when creating a query with 0 qttl", async () => {

			let string = "aePrice"
			let queryTtl = 0
			let rttl = 100
			let queryFee = 10

			let createQueryPromise = deployedMarketContract.call('create_query', {
				args: `(${oracleId},"${string}", ${queryFee}, ${queryTtl}, ${rttl})`,
				options: {
					ttl: config.ttl,
					verify: true
				},
				abi: "sophia"
			});

			await assert.isRejected(createQueryPromise, "_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAI1F1ZXJ5IFRUTCBtdXN0IGJlIGdyZWF0ZXIgdGhhbiB6ZXJvAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADDFfMF", "Create Query not failing with zero value for qttl")
		})

		it("should throw when creating a query with 0 rttl", async () => {

			let string = "aePrice"
			let queryTtl = 100
			let rttl = 0
			let queryFee = 10

			let createQueryPromise = deployedMarketContract.call('create_query', {
				args: `(${oracleId},"${string}", ${queryFee}, ${queryTtl}, ${rttl})`,
				options: {
					ttl: config.ttl,
					verify: true
				},
				abi: "sophia"
			});

			await assert.isRejected(createQueryPromise, "_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJlJlbGF0aXZlIFRUTCBtdXN0IGJlIGdyZWF0ZXIgdGhhbiB6ZXJvAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADnxm7C", "Create Query not failing with zero value for rttl")
		})

		it("should throw when creating query for AE Price from the market with 0 qfee", async () => {

			let queryTtl = 50
			let queryFee = 0

			let createQueryPromise = deployedMarketContract.call('create_ae_price_query', {
				args: `(${oracleId}, ${queryFee}, ${queryTtl}, ${queryTtl})`,
				options: {
					ttl: config.ttl,
					verify: true
				},
				abi: "sophia"
			});

			await assert.isRejected(createQueryPromise, "_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAI1F1ZXJ5IGZlZSBtdXN0IGJlIGdyZWF0ZXIgdGhhbiB6ZXJvAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABGMQUi", "Create Query for Ae Price not failing with zero value for qfee")
		})
		it("should throw when creating query for AE Price from the market with 0 qttl", async () => {

			let queryTtl = 0
			let queryFee = 100

			let createQueryPromise = deployedMarketContract.call('create_ae_price_query', {
				args: `(${oracleId}, ${queryFee}, ${queryTtl}, ${queryTtl})`,
				options: {
					ttl: config.ttl,
					verify: true
				},
				abi: "sophia"
			});

			await assert.isRejected(createQueryPromise, "_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAI1F1ZXJ5IFRUTCBtdXN0IGJlIGdyZWF0ZXIgdGhhbiB6ZXJvAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADDFfMF", "Create Query for Ae Price not failing with zero value for qttl")
		})

		it("should throw when creating query for AE Price from the market with 0 qfee", async () => {

			let queryTtl = 50
			let queryFee = 100

			let createQueryPromise = deployedMarketContract.call('create_ae_price_query', {
				args: `(${oracleId}, ${queryFee}, ${queryTtl}, ${0})`,
				options: {
					ttl: config.ttl,
					verify: true
				},
				abi: "sophia"
			});

			await assert.isRejected(createQueryPromise, "_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJlJlbGF0aXZlIFRUTCBtdXN0IGJlIGdyZWF0ZXIgdGhhbiB6ZXJvAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADnxm7C", "Create Query for Ae Price not failing with zero value for rttl")
		})

		it("should throw when creating query for Token Price from the market with 0 qfee", async () => {

			let queryTtl = 50
			let queryFee = 0

			let createQueryPromise = deployedMarketContract.call('create_token_price_query', {
				args: `(${oracleId}, ${queryFee}, ${queryTtl}, ${queryTtl})`,
				options: {
					ttl: config.ttl,
					verify: true
				},
				abi: "sophia"
			});

			await assert.isRejected(createQueryPromise, "_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAI1F1ZXJ5IGZlZSBtdXN0IGJlIGdyZWF0ZXIgdGhhbiB6ZXJvAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABGMQUi", "Create Query for Token Price not failing with zero value for qfee")
		})
		it("should throw when creating query for Token Price from the market with 0 qttl", async () => {

			let queryTtl = 0
			let queryFee = 100

			let createQueryPromise = deployedMarketContract.call('create_token_price_query', {
				args: `(${oracleId}, ${queryFee}, ${queryTtl}, ${queryTtl})`,
				options: {
					ttl: config.ttl,
					verify: true
				},
				abi: "sophia"
			});

			await assert.isRejected(createQueryPromise, "_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAI1F1ZXJ5IFRUTCBtdXN0IGJlIGdyZWF0ZXIgdGhhbiB6ZXJvAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADDFfMF", "Create Query for Token Price not failing with zero value for qttl")
		})

		it("should throw when creating query for Token Price from the market with 0 qfee", async () => {

			let queryTtl = 50
			let queryFee = 100

			let createQueryPromise = deployedMarketContract.call('create_token_price_query', {
				args: `(${oracleId}, ${queryFee}, ${queryTtl}, ${0})`,
				options: {
					ttl: config.ttl,
					verify: true
				},
				abi: "sophia"
			});

			await assert.isRejected(createQueryPromise, "_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJlJlbGF0aXZlIFRUTCBtdXN0IGJlIGdyZWF0ZXIgdGhhbiB6ZXJvAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADnxm7C", "Create Query for Token Price not failing with zero value for rttl")
		})
	})



})