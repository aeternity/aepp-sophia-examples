const { utils, wallets } = require('@aeternity/aeproject');

const chai = require('chai');
const assert = chai.assert;
const assertNode = require('assert').strict;

describe('ExchangeOracles', () => {
	
	let aeSdk;
	const exchangeOracleContent = utils.getContractContent('./contracts/ExchangeOracles/ExchangeOracle.aes');
	const exchangeMarketContent = utils.getContractContent('./contracts/ExchangeOracles/ExchangeMarket.aes');
	const owner = wallets[0];
	let exchangeOracleInstance, exchangeMarketInstance;

	before(async () => {
        aeSdk = await utils.getSdk();
		exchangeOracleInstance = await aeSdk.initializeContract({ sourceCode: exchangeOracleContent });
		exchangeMarketInstance = await aeSdk.initializeContract({ sourceCode: exchangeMarketContent });
	});

	it('should throw when deploying oracle contract with zero qfee', async () => {
		await assertNode.rejects(exchangeOracleInstance.init(0, 1000), (err) => {
            assert.include(err.message, "Qfee must be passed as an argument and should be greater than zero");
            return true;
        });
	});

	it('should throw when deploying oracle contract with zero ttl', async () => {
		await assertNode.rejects(exchangeOracleInstance.init(50, 0), (err) => {
            assert.include(err.message, "TTL must be passed as an argument and should be greater than zero");
            return true;
        });
	});

	it('should throw when deploying market contract with zero ae price', async () => {
		await assertNode.rejects(exchangeMarketInstance.init(0, 150), (err) => {
            assert.include(err.message, "The price for the AE must be greater than zero");
            return true;
        });
	});

	it('should throw when deploying market contract with zero token price', async () => {
		await assertNode.rejects(exchangeMarketInstance.init(100, 0), (err) => {
            assert.include(err.message, "The price for the token must be greater than zero");
            return true;
        });
	});

	it('deploying oracle successfully', async () => {
		const result = await exchangeOracleInstance.init(50, 1000);
		assert.equal(result.owner, owner.publicKey);
	});

	it('deploying market successfully', async () => {
		const result = await exchangeMarketInstance.init(100, 150);
		assert.equal(result.owner, owner.publicKey);
	});

	describe('Oracle smart contract tests', () => {
		before(async () => {
			exchangeOracleInstance = await aeSdk.initializeContract({ sourceCode: exchangeOracleContent });
			await exchangeOracleInstance.init(50, 500, {amount: 100000})
			// create a snapshot of the blockchain state
			await utils.createSnapshot(aeSdk);
		});

		// after each test roll back to initial state
		afterEach(async () => {
			await utils.rollbackSnapshot(aeSdk);
		});

		it('should register an oracle successfully  ', async () => {
			const result = await exchangeOracleInstance.get_oracle();
			assert.include(result.decodedResult, "ok_", 'Registering the oracle has failed');
		});

		it('should make a query from the oracle contract', async () => {
			const result = await exchangeOracleInstance.create_query("aePrice", 70, 50, 50);
			assert.include(result.decodedResult, "oq_", 'Querying the oracle has failed');
		});

		it('should get the question from the oracle', async () => {
			let result = await exchangeOracleInstance.create_query("aePrice", 70, 50, 50);
			assert.include(result.decodedResult, "oq_", 'Querying the oracle has failed');

			result = await exchangeOracleInstance.get_question(result.decodedResult);
			assert.equal(result.decodedResult, "aePrice", "The returned question is not correct")
		});

		it("should respond to question", async () => {
			let result = await exchangeOracleInstance.create_query("aePrice", 70, 50, 50);
			await assertNode.doesNotReject(exchangeOracleInstance.respond_to_question(result.decodedResult, 100));
		});
	})

	describe('Exchange Market smart contract tests', () => {
		let oracleId;

		before(async () => {
			exchangeOracleInstance = await aeSdk.initializeContract({ sourceCode: exchangeOracleContent });
			exchangeMarketInstance = await aeSdk.initializeContract({ sourceCode: exchangeMarketContent });
			await exchangeOracleInstance.init(50, 1000, {amount: 100000});
			await exchangeMarketInstance.init(100, 150, {amount: 100000});
			const result = await exchangeOracleInstance.get_oracle();
			oracleId = result.decodedResult;
			// create a snapshot of the blockchain state
			await utils.createSnapshot(aeSdk);
		});

		// after each test roll back to initial state
		afterEach(async () => {
			await utils.rollbackSnapshot(aeSdk);
		});

		it("should get the query_fee", async () => {
			const result = await exchangeMarketInstance.query_fee(oracleId);
			assert.equal(result.decodedResult, 50, "The query fee is not correct");
		});

		it("should update the ae price", async () => {
			await exchangeMarketInstance.update_price(2000, "ae");
			const result = await exchangeMarketInstance.get_ae_price();
			assert.equal(result.decodedResult, 2000, "Ae price was not updated properly");
		});

		it("should update the token price", async () => {
			await exchangeMarketInstance.update_price(2000, "token");
			const result = await exchangeMarketInstance.get_token_price();
			assert.equal(result.decodedResult, 2000, "Token price was not updated properly");
		});

		it("should create a query from the market", async () => {
			const result = await exchangeMarketInstance.create_query(oracleId, "aePrice", 70, 50, 50);
			assert.include(result.decodedResult, "oq_", 'Querying the oracle has failed');
		});

		it("should create query for AE Price from the market", async () => {
			const result = await exchangeMarketInstance.create_ae_price_query(oracleId, 70, 50, 50);
			assert.include(result.decodedResult, "oq_", 'Querying the oracle has failed');
		});
		
		it("should create query for Token price from the market", async () => {
			const result = await exchangeMarketInstance.create_token_price_query(oracleId, 70, 50, 50);
			assert.include(result.decodedResult, "oq_", 'Querying the oracle has failed');
		});

		it("should get the answer to a question", async () => {
			const answer = 100;
			let result = await exchangeOracleInstance.create_query("aePrice", 70, 50, 50);
			const queryId = result.decodedResult;
			await exchangeOracleInstance.respond_to_question(queryId, answer);
			result = await exchangeMarketInstance.get_answer(oracleId, queryId);
			assert.equal(result.decodedResult, answer, "The answer is not correct");
		});

		it("should throw if the new ae price is not greater than zero", async () => {
			await assertNode.rejects(exchangeMarketInstance.update_price(0, "ae"), (err) => {
				assert.include(err.message, "The new price must be greater than zero");
				return true;
			});
		});

		it("should throw if the new token price is not greater than zero", async () => {
			await assertNode.rejects(exchangeMarketInstance.update_price(0, "token"), (err) => {
				assert.include(err.message, "The new price must be greater than zero");
				return true;
			});
		})

		it("should throw if asset is net recognized", async () => {
			await assertNode.rejects(exchangeMarketInstance.update_price(100, "unknown_asset"), (err) => {
				assert.include(err.message, "Unrecognized asset");
				return true;
			});
		})

		it("should throw when creating a query with 0 qfee", async () => {
			await assertNode.rejects(exchangeMarketInstance.create_query(oracleId, "aePrice", 0, 50, 50), (err) => {
				assert.include(err.message, "Query fee must be greater than zero");
				return true;
			});
		})

		it("should throw when creating a query with 0 qttl", async () => {
			await assertNode.rejects(exchangeMarketInstance.create_query(oracleId, "aePrice", 10, 0, 100), (err) => {
				assert.include(err.message, "Query TTL must be greater than zero");
				return true;
			});
		});

		it("should throw when creating a query with 0 rttl", async () => {
			await assertNode.rejects(exchangeMarketInstance.create_query(oracleId, "aePrice", 10, 100, 0), (err) => {
				assert.include(err.message, "Relative TTL must be greater than zero");
				return true;
			});
		});

		it("should throw when creating query for AE Price from the market with 0 qfee", async () => {
			await assertNode.rejects(exchangeMarketInstance.create_ae_price_query(oracleId, 0, 50, 50), (err) => {
				assert.include(err.message, "Query fee must be greater than zero");
				return true;
			});
		});

		it("should throw when creating query for AE Price from the market with 0 qttl", async () => {
			await assertNode.rejects(exchangeMarketInstance.create_ae_price_query(oracleId, 100, 0, 50), (err) => {
				assert.include(err.message, "Query TTL must be greater than zero");
				return true;
			});
		});

		it("should throw when creating query for AE Price from the market with 0 rttl", async () => {
			await assertNode.rejects(exchangeMarketInstance.create_ae_price_query(oracleId, 100, 50, 0), (err) => {
				assert.include(err.message, "Relative TTL must be greater than zero");
				return true;
			});
		});

		it("should throw when creating query for Token Price from the market with 0 qfee", async () => {
			await assertNode.rejects(exchangeMarketInstance.create_token_price_query(oracleId, 0, 50, 50), (err) => {
				assert.include(err.message, "Query fee must be greater than zero");
				return true;
			});
		});

		it("should throw when creating query for Token Price from the market with 0 qttl", async () => {
			await assertNode.rejects(exchangeMarketInstance.create_token_price_query(oracleId, 100, 0, 50), (err) => {
				assert.include(err.message, "Query TTL must be greater than zero");
				return true;
			});
		});

		it("should throw when creating query for Token Price from the market with 0 rttl", async () => {
			await assertNode.rejects(exchangeMarketInstance.create_token_price_query(oracleId, 100, 50, 0), (err) => {
				assert.include(err.message, "Relative TTL must be greater than zero");
				return true;
			});
		});
	});
});