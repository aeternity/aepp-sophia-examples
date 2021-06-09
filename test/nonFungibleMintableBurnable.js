const chai = require('chai');
const assert = chai.assert;
const assertNode = require('assert').strict;

const { Universal, MemoryAccount, Node } = require('@aeternity/aepp-sdk');

const NETWORKS = require('../config/network.json');
const NETWORK_NAME = "local";

const {defaultWallets: WALLETS} = require('../config/wallets.json');

const contractUtils = require('../utils/contract-utils');

const owner = WALLETS[0], nonOwner = WALLETS[1], operator = WALLETS[3];

describe('Non Fungible Token - Mintable & Burnable', () => {
    let nonFungibleMintableBurnableInstance;

    before(async () => {
        const node = await Node({ url: NETWORKS[NETWORK_NAME].nodeUrl });
        const client = await Universal({
            nodes: [
              { name: NETWORK_NAME, instance: node },
            ],
            compilerUrl: NETWORKS[NETWORK_NAME].compilerUrl,
            accounts: [
                MemoryAccount({ keypair: owner }),
                MemoryAccount({ keypair: nonOwner }),
                MemoryAccount({ keypair: operator })
            ],
            address: owner.publicKey
        });
        const contractContent = contractUtils.getContractContent('./contracts/NonFungibleToken/NonFungibleMintableBurnable.aes');
        nonFungibleMintableBurnableInstance = await client.getContractInstance(contractContent);
    });

    describe('Deploy contract', async () => {
        it('deploying successfully', async () => {
            await nonFungibleMintableBurnableInstance.deploy(["Non Fungible Token - Mintable & Burnable", "NFT"], {onAccount: owner.publicKey});
        });
    });

    describe('Interact with contract', () => {
        it('Verify initial state', async () => {
            let result = await nonFungibleMintableBurnableInstance.methods.name();
            assert.equal(result.decodedResult, "Non Fungible Token - Mintable & Burnable");
            result = await nonFungibleMintableBurnableInstance.methods.symbol();
            assert.equal(result.decodedResult, "NFT");
            result = await nonFungibleMintableBurnableInstance.methods.owner();
            assert.equal(result.decodedResult, owner.publicKey);
        });

        describe('Contract functionality', () => {
           describe('Mint', () => {
                it('should not mint from non-owner', async () => {
                    await assertNode.rejects(nonFungibleMintableBurnableInstance.methods.mint(1, nonOwner.publicKey, {onAccount: nonOwner.publicKey}), (err) => {
                        assert.include(err.message, "Only contract owner can mint");
                        return true;
                    });
                });

                it('should mint 1 token successfully', async () => {
                    await nonFungibleMintableBurnableInstance.methods.mint(1, owner.publicKey);
                    
                    let result = await nonFungibleMintableBurnableInstance.methods.owner_of(1);
                    assert.equal(result.decodedResult, owner.publicKey);

                    result = await nonFungibleMintableBurnableInstance.methods.balance_of(owner.publicKey);
                    assert.equal(result.decodedResult, 1);
                });

                it('should not mint token with id that already exist', async () => {
                    await assertNode.rejects(nonFungibleMintableBurnableInstance.methods.mint(1, nonOwner.publicKey), (err) => {
                        assert.include(err.message, "Token already minted");
                        return true;
                    });
                });
            })

            describe('Burn', () => {
                it(`shouldn't burn token from non-owner`, async () => {
                    await assertNode.rejects(nonFungibleMintableBurnableInstance.methods.burn(1, {onAccount: nonOwner.publicKey}), (err) => {
                        assert.include(err.message, "Only token owner can burn");
                        return true;
                    });
                });
                
                it('should burn token successfully', async () => {
                    let result = await nonFungibleMintableBurnableInstance.methods.balance_of(owner.publicKey);
                    assert.equal(result.decodedResult, 1);

                    await nonFungibleMintableBurnableInstance.methods.burn(1);
                    result = await nonFungibleMintableBurnableInstance.methods.owner_of(1);
                    assert.equal(result.decodedResult, undefined);

                    result = await nonFungibleMintableBurnableInstance.methods.balance_of(owner.publicKey);
                    assert.equal(result.decodedResult, 0);
                });
            });

            describe('Transfer', () => {
                before(async () => {
                    await nonFungibleMintableBurnableInstance.methods.mint(2, owner.publicKey);
                    await nonFungibleMintableBurnableInstance.methods.mint(3, owner.publicKey);
                    await nonFungibleMintableBurnableInstance.methods.mint(4, owner.publicKey);
                });

                it('should handle regular transfer correctly', async () => {
                    let result = await nonFungibleMintableBurnableInstance.methods.balance_of(nonOwner.publicKey);
                    assert.equal(result.decodedResult, 0);
                    result = await nonFungibleMintableBurnableInstance.methods.balance_of(owner.publicKey);
                    assert.equal(result.decodedResult, 3);

                    await nonFungibleMintableBurnableInstance.methods.transfer_from(owner.publicKey, nonOwner.publicKey, 2);

                    result = await nonFungibleMintableBurnableInstance.methods.balance_of(nonOwner.publicKey);
                    assert.equal(result.decodedResult, 1);
                    result = await nonFungibleMintableBurnableInstance.methods.balance_of(owner.publicKey);
                    assert.equal(result.decodedResult, 2);
                    result = await nonFungibleMintableBurnableInstance.methods.owner_of(2);
                    assert.equal(result.decodedResult, nonOwner.publicKey);
                });

                it('should handle approve & transfer correctly', async () => {
                    let result = await nonFungibleMintableBurnableInstance.methods.get_approved(3);
                    assert.equal(result.decodedResult, undefined);

                    await assertNode.rejects(nonFungibleMintableBurnableInstance.methods.transfer_from(owner.publicKey, nonOwner.publicKey, 3, {onAccount: nonOwner.publicKey}), (err) => {
                        assert.include(err.message, "Neither owner nor approved");
                        return true;
                    });

                    await assertNode.rejects(nonFungibleMintableBurnableInstance.methods.approve(3, owner.publicKey, {onAccount: owner.publicKey}), (err) => {
                        assert.include(err.message, "Cannot approve the same address");
                        return true;
                    });

                    await assertNode.rejects(nonFungibleMintableBurnableInstance.methods.approve(3, nonOwner.publicKey, {onAccount: operator.publicKey}), (err) => {
                        assert.include(err.message, "Neither owner nor operator");
                        return true;
                    });

                    await nonFungibleMintableBurnableInstance.methods.approve(3, nonOwner.publicKey);

                    result = await nonFungibleMintableBurnableInstance.methods.get_approved(3);
                    assert.equal(result.decodedResult, nonOwner.publicKey);

                    await nonFungibleMintableBurnableInstance.methods.transfer_from(owner.publicKey, nonOwner.publicKey, 3, {onAccount: nonOwner.publicKey});
                    result = await nonFungibleMintableBurnableInstance.methods.owner_of(3);
                    assert.equal(result.decodedResult, nonOwner.publicKey);

                    result = await nonFungibleMintableBurnableInstance.methods.get_approved(3);
                    assert.equal(result.decodedResult, undefined);
                });

                it('should handle set_approve_for_all & transfer correctly', async () => {
                    let result = await nonFungibleMintableBurnableInstance.methods.is_approved_for_all(owner.publicKey, operator.publicKey);
                    assert.isFalse(result.decodedResult);
                    await nonFungibleMintableBurnableInstance.methods.set_approval_for_all(operator.publicKey, true, {onAccount: owner.publicKey});
                    result = await nonFungibleMintableBurnableInstance.methods.is_approved_for_all(owner.publicKey, operator.publicKey);
                    assert.isTrue(result.decodedResult);

                    result = await nonFungibleMintableBurnableInstance.methods.owner_of(4);
                    assert.equal(result.decodedResult, owner.publicKey);

                    await nonFungibleMintableBurnableInstance.methods.approve(4, nonOwner.publicKey, {onAccount: operator.publicKey});

                    result = await nonFungibleMintableBurnableInstance.methods.get_approved(4);
                    assert.equal(result.decodedResult, nonOwner.publicKey);

                    result = await nonFungibleMintableBurnableInstance.methods.balance_of(operator.publicKey);
                    assert.equal(result.decodedResult, 0);
                    await nonFungibleMintableBurnableInstance.methods.transfer_from(owner.publicKey, operator.publicKey, 4, {onAccount: operator.publicKey});
                    result = await nonFungibleMintableBurnableInstance.methods.balance_of(operator.publicKey);
                    assert.equal(result.decodedResult, 1);

                    result = await nonFungibleMintableBurnableInstance.methods.get_approved(4);
                    assert.equal(result.decodedResult, undefined);
                });
            });
        });
    });
});