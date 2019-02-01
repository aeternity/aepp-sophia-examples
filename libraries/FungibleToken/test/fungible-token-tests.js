const chai = require('chai');
let chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const assert = chai.assert;
const utils = require('./../utils/utils');
const AeSDK = require('@aeternity/aepp-sdk');
const Universal = AeSDK.Universal;
const config = require("./constants/config.json");
const contractFilePath = "./../contracts/fungible-token.aes";

const path = require('path');
const errorMessages = require('./constants/error-messages.json');

const ownerPublicKeyAsHex = utils.publicKeyToHex(config.ownerKeyPair.publicKey);
const notOwnerPublicKeyAsHex = utils.publicKeyToHex(config.notOwnerKeyPair.publicKey);

const fungibleTokenFunctions = require('./constants/fungible-token-functions');

describe('Fungible token', () => {

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

			describe('Mint', () => {
				it('should mint 1000 token successfully', async () => {
					//Arrange
					const expectedBalance = 1000;

					//Act
					const balanceOfPromise = deployedContract.call(fungibleTokenFunctions.BALANCE_OF, {
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

				it('should not mint from non-owner', async () => {
					const unauthorisedPromise = secondClient.contractCall(compiledContract.bytecode, config.abiType, deployedContract.address, fungibleTokenFunctions.MINT, {
						args: `(${ownerPublicKeyAsHex}, 123)`,
						options: {
							ttl: config.ttl
						}
					})
					await assert.isRejected(unauthorisedPromise, errorMessages.ONLY_OWNER_CAN_MINT);
				})

				it('should increase total supply on mint', async () => {
					//Arrange
					const expectedTotalSupply = 1003;

					//Act
					//1000 tokens are already minted
					const deployContractPromise1 = deployedContract.call(fungibleTokenFunctions.MINT, {
						args: `(${ownerPublicKeyAsHex}, 1)`,
						options: {
							ttl: config.ttl
						},
						abi: config.abiType
					})
					
					await deployContractPromise1;

					const deployContractPromise2 = deployedContract.call(fungibleTokenFunctions.MINT, {
						args: `(${ownerPublicKeyAsHex}, 1)`,
						options: {
							ttl: config.ttl
						},
						abi: config.abiType
					})
					
					await deployContractPromise2;

					const deployContractPromise3 = deployedContract.call(fungibleTokenFunctions.MINT, {
						args: `(${ownerPublicKeyAsHex}, 1)`,
						options: {
							ttl: config.ttl
						},
						abi: config.abiType
					})
					await deployContractPromise3;

					const totalSupplyPromise = deployedContract.call(fungibleTokenFunctions.TOTAL_SUPPLY, {
						options: {
							ttl: config.ttl
						}
					});

					const totalSupplyResult = await totalSupplyPromise;

					//Assert
					const totalSupplyResultDecoded = await totalSupplyResult.decode("int");
					assert.equal(totalSupplyResultDecoded.value, expectedTotalSupply)
				})

			})

			describe('Burn', () => {
				it('should burn token successfully', async () => {
					//Arrange
					const expectedBalance = 900;
					const burnAmount = 100;

					//Act
					const ownerOfPromise = deployedContract.call(fungibleTokenFunctions.BURN, {
						args: `(${burnAmount})`,
						options: {
							ttl: config.ttl
						}
					});
					
					await ownerOfPromise;

					const balanceOfPromise = deployedContract.call(fungibleTokenFunctions.BALANCE_OF, {
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

				it('shouldn`t burn more tokens than it has', async () => {
					//Arrange
					const burnAmount = 100;

					//Act
					const unauthorizedBurnPromise = secondClient.contractCall(compiledContract.bytecode, config.abiType, deployedContract.address, fungibleTokenFunctions.BURN, {
						args: `(${burnAmount})`,
						options: {
							ttl: config.ttl
						}
					})

					//Assert
					await assert.isRejected(unauthorizedBurnPromise, errorMessages.LESS_TOKENS_THAN_ACCOUNT_BALANCE);
				})

				it('should decrease total supply on burn', async () => {
					//Arrange
					const expectedTotalSupply = 900;
					const burnAmount = 50;

					//Act
					const ownerOfPromise1 = deployedContract.call(fungibleTokenFunctions.BURN, {
						args: `(${burnAmount})`,
						options: {
							ttl: config.ttl
						}
					});
					
					await ownerOfPromise1;

					const ownerOfPromise2 = deployedContract.call(fungibleTokenFunctions.BURN, {
						args: `(${burnAmount})`,
						options: {
							ttl: config.ttl
						}
					});
					
					await ownerOfPromise2;

					const balanceOfPromise = deployedContract.call(fungibleTokenFunctions.TOTAL_SUPPLY, {
						options: {
							ttl: config.ttl
						}
					});
					
					const balanceOfResult = await balanceOfPromise;

					//Assert
					const decodedBalanceOfResult = await balanceOfResult.decode("int");
					assert.equal(decodedBalanceOfResult.value, expectedTotalSupply)
				})
			})

			describe('Transfer', async () => {

				it('should transfer token successfully', async () => {
					//Arrange
					const expectedBalanceOfNotOwner = 10;
					const expectedBalanceOfOwner = 990;
					const transferAmount = 10;

					//Act
					const approvePromise = deployedContract.call(fungibleTokenFunctions.APPROVE, {
						args: `(${notOwnerPublicKeyAsHex}, ${transferAmount})`,
						options: {
							ttl: config.ttl
						}
					});
					
					await approvePromise;

					const transferFromPromise = secondClient.contractCall(compiledContract.bytecode, config.abiType, deployedContract.address, fungibleTokenFunctions.TRANSFER_FROM, {
						args: `(${ownerPublicKeyAsHex}, ${notOwnerPublicKeyAsHex}, ${transferAmount})`,
						options: {
							ttl: config.ttl
						}
					})

					await transferFromPromise;
					
					const balanceOfNotOwnerPromise = deployedContract.call(fungibleTokenFunctions.BALANCE_OF, {
						args: `(${notOwnerPublicKeyAsHex})`,
						options: {
							ttl: config.ttl
						}
					});
					
					const balanceOfNotOwnerResult = await balanceOfNotOwnerPromise;
					
					const balanceOwnerPromise = deployedContract.call(fungibleTokenFunctions.BALANCE_OF, {
						args: `(${ownerPublicKeyAsHex})`,
						options: {
							ttl: config.ttl
						}
					});
					
					const balanceOfOwnerResult = await balanceOwnerPromise;

					//Assert
					const decodedBalanceOfNotOwnerResult = await balanceOfNotOwnerResult.decode("int");
					const decodedBalanceOfOwnerResult = await balanceOfOwnerResult.decode("int");

					assert.equal(decodedBalanceOfNotOwnerResult.value, expectedBalanceOfNotOwner)
					assert.equal(decodedBalanceOfOwnerResult.value, expectedBalanceOfOwner)
				})

				it('shouldn`t transfer token without approve', async () => {
					//Arrange
					const expectedBalanceOfNotOwner = 0;
					const expectedBalanceOfOwner = 1000;
					const transferAmount = 123;

					//Act
					const transferFromPromise = secondClient.contractCall(compiledContract.bytecode, config.abiType, deployedContract.address, fungibleTokenFunctions.TRANSFER_FROM, {
						args: `(${ownerPublicKeyAsHex}, ${notOwnerPublicKeyAsHex}, ${transferAmount})`,
						options: {
							ttl: config.ttl
						}
					})

					await assert.isRejected(transferFromPromise, errorMessages.VALUE_IS_BIGGER_THAN_ALLOWED);

					const balanceOfNotOwnerPromise = deployedContract.call(fungibleTokenFunctions.BALANCE_OF, {
						args: `(${notOwnerPublicKeyAsHex})`,
						options: {
							ttl: config.ttl
						}
					});
					
					const balanceOfNotOwnerResult = await balanceOfNotOwnerPromise;

					const balanceOwnerPromise = deployedContract.call(fungibleTokenFunctions.BALANCE_OF, {
						args: `(${ownerPublicKeyAsHex})`,
						options: {
							ttl: config.ttl
						}
					});
					
					const balanceOfOwnerResult = await balanceOwnerPromise;

					//Assert
					const decodedBalanceOfNotOwnerResult = await balanceOfNotOwnerResult.decode("int");
					const decodedBalanceOfOwnerResult = await balanceOfOwnerResult.decode("int");

					assert.equal(decodedBalanceOfNotOwnerResult.value, expectedBalanceOfNotOwner)
					assert.equal(decodedBalanceOfOwnerResult.value, expectedBalanceOfOwner)
				})
			})

			describe('Transfer', () => {
				it('should increase allowance successfully', async () => {
					//Arrange
					const expectedAllowance = 20;
					const transferAmount = 10;

					//Act
					const approvePromise = deployedContract.call(fungibleTokenFunctions.APPROVE, {
						args: `(${notOwnerPublicKeyAsHex}, ${transferAmount})`,
						options: {
							ttl: config.ttl
						}
					});
					
					await approvePromise;

					const increaseAllowancePromise = deployedContract.call(fungibleTokenFunctions.INCREASE_ALLOWANCE, {
						args: `(${notOwnerPublicKeyAsHex}, ${transferAmount})`,
						options: {
							ttl: config.ttl
						}
					});
					
					await increaseAllowancePromise;

					const allowancePromise = deployedContract.call(fungibleTokenFunctions.ALLOWANCE, {
						args: `(${ownerPublicKeyAsHex}, ${notOwnerPublicKeyAsHex})`,
						options: {
							ttl: config.ttl
						}
					});
					
					const allowancePromiseResult = await allowancePromise;

					//Assert
					const allowanceResult = await allowancePromiseResult.decode("int");

					assert.equal(allowanceResult.value, expectedAllowance)
				})

				it('should deccrease allowance successfully', async () => {
					//Arrange
					const expectedAllowance = 9;
					const transferAmount = 10;
					const decreaseAmount = 1;

					//Act
					const approvePromise = deployedContract.call(fungibleTokenFunctions.APPROVE, {
						args: `(${notOwnerPublicKeyAsHex}, ${transferAmount})`,
						options: {
							ttl: config.ttl
						}
					});
					
					await approvePromise;

					const decreaseAllowancePromise = deployedContract.call(fungibleTokenFunctions.DECREASE_ALLOWANCE, {
						args: `(${notOwnerPublicKeyAsHex}, ${decreaseAmount})`,
						options: {
							ttl: config.ttl
						}
					});
					
					await decreaseAllowancePromise;

					const allowancePromise = deployedContract.call(fungibleTokenFunctions.ALLOWANCE, {
						args: `(${ownerPublicKeyAsHex}, ${notOwnerPublicKeyAsHex})`,
						options: {
							ttl: config.ttl
						}
					});
					
					const allowancePromiseResult = await allowancePromise;

					//Assert
					const allowanceResult = await allowancePromiseResult.decode("int");

					assert.equal(allowanceResult.value, expectedAllowance)
				})
			})
		})
	})
})