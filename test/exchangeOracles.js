const chai = require('chai');
const assert = chai.assert;
const assertNode = require('assert/strict');

const { Universal, MemoryAccount, Node } = require('@aeternity/aepp-sdk');

const NETWORKS = require('../config/network.json');
const NETWORK_NAME = "local";

const {defaultWallets: WALLETS} = require('../config/wallets.json');

const contractUtils = require('../utils/contract-utils');

describe('ExchangeOracles', () => {
	
	const owner = WALLETS[0];
	let client;
	let exchangeOracleInstance, exchangeMarketInstance;

	before(async () => {
		const node = await Node({ url: NETWORKS[NETWORK_NAME].nodeUrl });
        client = await Universal({
            nodes: [
              { name: NETWORK_NAME, instance: node },
            ],
            compilerUrl: NETWORKS[NETWORK_NAME].compilerUrl,
            accounts: [MemoryAccount({ keypair: owner })],
            address: owner.publicKey
        });
		const exchangeOracleContent = contractUtils.getContractContent('./contracts/ExchangeOracles/ExchangeOracle.aes');
		const exchangeMarketContent = contractUtils.getContractContent('./contracts/ExchangeOracles/ExchangeMarket.aes');
		exchangeOracleInstance = await client.getContractInstance(exchangeOracleContent);
		exchangeMarketInstance = await client.getContractInstance(exchangeMarketContent);
	});

	it('deploying oracle successfully', async () => {
		const result = await exchangeOracleInstance.deploy([50, 1000]);
		assert.equal(result.owner, owner.publicKey);
	});

	it('deploying market successfully', async () => {
		const result = await exchangeMarketInstance.deploy([100, 150]);
		assert.equal(result.owner, owner.publicKey);
	});

	it('should throw when deploying oracle contract with zero qfee', async () => {
		await assertNode.rejects(exchangeOracleInstance.deploy([0, 1000]), (err) => {
            assert.include(err.message, "Qfee must be passed as an argument and should be greater than zero");
            return true;
        });
	});

	it('should throw when deploying oracle contract with zero ttl', async () => {
		await assertNode.rejects(exchangeOracleInstance.deploy([50, 0]), (err) => {
            assert.include(err.message, "TTL must be passed as an argument and should be greater than zero");
            return true;
        });
	});

	it('should throw when deploying market contract with zero ae price', async () => {
		await assertNode.rejects(exchangeMarketInstance.deploy([0, 150]), (err) => {
            assert.include(err.message, "The price for the AE must be greater than zero");
            return true;
        });
	});

	it('should throw when deploying market contract with zero token price', async () => {
		await assertNode.rejects(exchangeMarketInstance.deploy([100, 0]), (err) => {
            assert.include(err.message, "The price for the token must be greater than zero");
            return true;
        });
	});

	describe('Oracle smart contract tests', () => {
		beforeEach(async () => {
			await exchangeOracleInstance.deploy([50, 500], {amount: 100000})
		});

		it('should register an oracle successfully  ', async () => {
			const result = await exchangeOracleInstance.methods.get_oracle();
			assert.include(result.decodedResult, "ok_", 'Registering the oracle has failed');
		});

		it('should make a query from the oracle contract', async () => {
			const result = await exchangeOracleInstance.methods.create_query("aePrice", 70, 50, 50);
			assert.include(result.decodedResult, "oq_", 'Querying the oracle has failed');
		});

		it('should get the question from the oracle', async () => {
			let result = await exchangeOracleInstance.methods.create_query("aePrice", 70, 50, 50);
			assert.include(result.decodedResult, "oq_", 'Querying the oracle has failed');

			result = await exchangeOracleInstance.methods.get_question(result.decodedResult);
			assert.equal(result.decodedResult, "aePrice", "The returned question is not correct")
		});

		it("should respond to question", async () => {
			let result = await exchangeOracleInstance.methods.create_query("aePrice", 70, 50, 50);
			await assertNode.doesNotReject(exchangeOracleInstance.methods.respond_to_question(result.decodedResult, 100));
		});
	})

	describe('Exchange Market smart contract tests', () => {
		let oracleId;
		beforeEach(async () => {
			await exchangeOracleInstance.deploy([50, 1000], {amount: 100000});
			await exchangeMarketInstance.deploy([100, 150], {amount: 100000});
			const result = await exchangeOracleInstance.methods.get_oracle();
			oracleId = result.decodedResult;
		});

		it("should get the query_fee", async () => {
			const result = await exchangeMarketInstance.methods.query_fee(oracleId);
			assert.equal(result.decodedResult, 50, "The query fee is not correct");
		});

		it("should update the ae price", async () => {
			await exchangeMarketInstance.methods.update_price(2000, "ae");
			const result = await exchangeMarketInstance.methods.get_ae_price();
			assert.equal(result.decodedResult, 2000, "Ae price was not updated properly");
		});

		it("should update the token price", async () => {
			await exchangeMarketInstance.methods.update_price(2000, "token");
			const result = await exchangeMarketInstance.methods.get_token_price();
			assert.equal(result.decodedResult, 2000, "Token price was not updated properly");
		});

		it("should create a query from the market", async () => {
			const result = await exchangeMarketInstance.methods.create_query(oracleId, "aePrice", 70, 50, 50);
			assert.include(result.decodedResult, "oq_", 'Querying the oracle has failed');
		});

		it("should create query for AE Price from the market", async () => {
			const result = await exchangeMarketInstance.methods.create_ae_price_query(oracleId, 70, 50, 50);
			assert.include(result.decodedResult, "oq_", 'Querying the oracle has failed');
		});
		
		it("should create query for Token price from the market", async () => {
			const result = await exchangeMarketInstance.methods.create_token_price_query(oracleId, 70, 50, 50);
			assert.include(result.decodedResult, "oq_", 'Querying the oracle has failed');
		});

		it("should get the answer to a question", async () => {
			const answer = 100;
			let result = await exchangeOracleInstance.methods.create_query("aePrice", 70, 50, 50);
			const queryId = result.decodedResult;
			await exchangeOracleInstance.methods.respond_to_question(queryId, answer);
			result = await exchangeMarketInstance.methods.get_answer(oracleId, queryId);
			assert.equal(result.decodedResult, answer, "The answer is not correct");
		});

		it("should throw if the new ae price is not greater than zero", async () => {
			await assertNode.rejects(exchangeMarketInstance.methods.update_price(0, "ae"), (err) => {
				assert.include(err.message, "The new price must be greater than zero");
				return true;
			});
		});

		it("should throw if the new token price is not greater than zero", async () => {
			await assertNode.rejects(exchangeMarketInstance.methods.update_price(0, "token"), (err) => {
				assert.include(err.message, "The new price must be greater than zero");
				return true;
			});
		})

		it("should throw if asset is net recognized", async () => {
			await assertNode.rejects(exchangeMarketInstance.methods.update_price(100, "unknown_asset"), (err) => {
				assert.include(err.message, "Unrecognized asset");
				return true;
			});
		})

		it("should throw when creating a query with 0 qfee", async () => {
			await assertNode.rejects(exchangeMarketInstance.methods.create_query(oracleId, "aePrice", 0, 50, 50), (err) => {
				assert.include(err.message, "Query fee must be greater than zero");
				return true;
			});
		})

		it("should throw when creating a query with 0 qttl", async () => {
			await assertNode.rejects(exchangeMarketInstance.methods.create_query(oracleId, "aePrice", 10, 0, 100), (err) => {
				assert.include(err.message, "Query TTL must be greater than zero");
				return true;
			});
		});

		it("should throw when creating a query with 0 rttl", async () => {
			await assertNode.rejects(exchangeMarketInstance.methods.create_query(oracleId, "aePrice", 10, 100, 0), (err) => {
				assert.include(err.message, "Relative TTL must be greater than zero");
				return true;
			});
		});

		it("should throw when creating query for AE Price from the market with 0 qfee", async () => {
			await assertNode.rejects(exchangeMarketInstance.methods.create_ae_price_query(oracleId, 0, 50, 50), (err) => {
				assert.include(err.message, "Query fee must be greater than zero");
				return true;
			});
		});

		it("should throw when creating query for AE Price from the market with 0 qttl", async () => {
			await assertNode.rejects(exchangeMarketInstance.methods.create_ae_price_query(oracleId, 100, 0, 50), (err) => {
				assert.include(err.message, "Query TTL must be greater than zero");
				return true;
			});
		});

		it("should throw when creating query for AE Price from the market with 0 rttl", async () => {
			await assertNode.rejects(exchangeMarketInstance.methods.create_ae_price_query(oracleId, 100, 50, 0), (err) => {
				assert.include(err.message, "Relative TTL must be greater than zero");
				return true;
			});
		});

		it("should throw when creating query for Token Price from the market with 0 qfee", async () => {
			await assertNode.rejects(exchangeMarketInstance.methods.create_token_price_query(oracleId, 0, 50, 50), (err) => {
				assert.include(err.message, "Query fee must be greater than zero");
				return true;
			});
		});

		it("should throw when creating query for Token Price from the market with 0 qttl", async () => {
			await assertNode.rejects(exchangeMarketInstance.methods.create_token_price_query(oracleId, 100, 0, 50), (err) => {
				assert.include(err.message, "Query TTL must be greater than zero");
				return true;
			});
		});

		it("should throw when creating query for Token Price from the market with 0 rttl", async () => {
			await assertNode.rejects(exchangeMarketInstance.methods.create_token_price_query(oracleId, 100, 50, 0), (err) => {
				assert.include(err.message, "Relative TTL must be greater than zero");
				return true;
			});
		});
	});
});