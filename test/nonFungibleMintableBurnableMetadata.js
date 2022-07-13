const { utils } = require('@aeternity/aeproject');

const chai = require('chai');
const assert = chai.assert;
const assertNode = require('assert').strict;

describe('Non Fungible Token - Mintable/Burnable/Metadata', async () => {
    const accounts = utils.getDefaultAccounts();
    const ownerAccount = accounts[0], nonOwnerAccount = accounts[1], operatorAccount = wallets[3];
    const ownerAddress = await ownerAccount.address(), nonOwnerAddress = await nonOwnerAccount.address(), operatorAddress = await operatorAccount.address();
    
    let nonFungibleMintableBurnableInstance;

    before(async () => {
        const aeSdk = await utils.getSdk();
        const contractContent = utils.getContractContent('./contracts/NonFungibleToken/NonFungibleMintableBurnableMetadata.aes');
        nonFungibleMintableBurnableInstance = await aeSdk.getContractInstance({ source: contractContent });
    });

    describe('Deploy contract', async () => {
        it('deploying successfully', async () => {
            await nonFungibleMintableBurnableInstance.deploy(["Non Fungible Token - Mintable/Burnable/Metadata", "NFT"], {onAccount: ownerAccount});
        });
    });

    describe('Interact with contract', () => {
        it('Verify initial state', async () => {
            let result = await nonFungibleMintableBurnableInstance.methods.name();
            assert.equal(result.decodedResult, "Non Fungible Token - Mintable/Burnable/Metadata");
            result = await nonFungibleMintableBurnableInstance.methods.symbol();
            assert.equal(result.decodedResult, "NFT");
            result = await nonFungibleMintableBurnableInstance.methods.owner();
            assert.equal(result.decodedResult, ownerAddress);
        });

        describe('Contract functionality', () => {
            describe('Mint', () => {
                it('should not mint from non-owner', async () => {
                    await assertNode.rejects(nonFungibleMintableBurnableInstance.methods.mint(1, nonOwnerAddress, {onAccount: nonOwnerAccount}), (err) => {
                        assert.include(err.message, "Only contract owner can mint");
                        return true;
                    });
                });

                it('should mint 1 token successfully', async () => {
                    await nonFungibleMintableBurnableInstance.methods.mint(1, ownerAddress);
                    
                    let result = await nonFungibleMintableBurnableInstance.methods.owner_of(1);
                    assert.equal(result.decodedResult, ownerAddress);

                    result = await nonFungibleMintableBurnableInstance.methods.balance_of(ownerAddress);
                    assert.equal(result.decodedResult, 1);
                });

                it('should not mint token with id that already exist', async () => {
                    await assertNode.rejects(nonFungibleMintableBurnableInstance.methods.mint(1, nonOwnerAddress), (err) => {
                        assert.include(err.message, "Token already minted");
                        return true;
                    });
                });
            })

            describe('Burn', () => {
                it(`shouldn't burn token from non-owner`, async () => {
                    await assertNode.rejects(nonFungibleMintableBurnableInstance.methods.burn(1, {onAccount: nonOwnerAddress}), (err) => {
                        assert.include(err.message, "Only token owner can burn");
                        return true;
                    });
                });
                
                it('should burn token successfully', async () => {
                    let result = await nonFungibleMintableBurnableInstance.methods.balance_of(ownerAddress);
                    assert.equal(result.decodedResult, 1);

                    await nonFungibleMintableBurnableInstance.methods.burn(1);
                    result = await nonFungibleMintableBurnableInstance.methods.owner_of(1);
                    assert.equal(result.decodedResult, undefined);

                    result = await nonFungibleMintableBurnableInstance.methods.balance_of(ownerAddress);
                    assert.equal(result.decodedResult, 0);
                });
            });

            describe('Transfer', () => {
                before(async () => {
                    await nonFungibleMintableBurnableInstance.methods.mint(2, ownerAddress);
                    await nonFungibleMintableBurnableInstance.methods.mint(3, ownerAddress);
                    await nonFungibleMintableBurnableInstance.methods.mint(4, ownerAddress);
                    await nonFungibleMintableBurnableInstance.methods.mint(5, ownerAddress);
                });

                it('should handle regular transfer correctly', async () => {
                    let result = await nonFungibleMintableBurnableInstance.methods.balance_of(nonOwnerAddress);
                    assert.equal(result.decodedResult, 0);
                    result = await nonFungibleMintableBurnableInstance.methods.balance_of(ownerAddress);
                    assert.equal(result.decodedResult, 4);

                    await nonFungibleMintableBurnableInstance.methods.transfer_from(ownerAddress, nonOwnerAddress, 2);

                    result = await nonFungibleMintableBurnableInstance.methods.balance_of(nonOwnerAddress);
                    assert.equal(result.decodedResult, 1);
                    result = await nonFungibleMintableBurnableInstance.methods.balance_of(ownerAddress);
                    assert.equal(result.decodedResult, 3);
                    result = await nonFungibleMintableBurnableInstance.methods.owner_of(2);
                    assert.equal(result.decodedResult, nonOwnerAddress);
                });

                it('should handle approve & transfer correctly', async () => {
                    let result = await nonFungibleMintableBurnableInstance.methods.get_approved(3);
                    assert.equal(result.decodedResult, undefined);

                    await assertNode.rejects(nonFungibleMintableBurnableInstance.methods.transfer_from(ownerAddress, nonOwnerAddress, 3, {onAccount: nonOwnerAccount}), (err) => {
                        assert.include(err.message, "Neither owner nor approved");
                        return true;
                    });

                    await assertNode.rejects(nonFungibleMintableBurnableInstance.methods.approve(3, ownerAddress, {onAccount: ownerAccount}), (err) => {
                        assert.include(err.message, "Cannot approve the same address");
                        return true;
                    });

                    await assertNode.rejects(nonFungibleMintableBurnableInstance.methods.approve(3, nonOwnerAddress, {onAccount: operatorAccount}), (err) => {
                        assert.include(err.message, "Neither owner nor operator");
                        return true;
                    });

                    await nonFungibleMintableBurnableInstance.methods.approve(3, nonOwnerAddress);

                    result = await nonFungibleMintableBurnableInstance.methods.get_approved(3);
                    assert.equal(result.decodedResult, nonOwnerAddress);

                    await nonFungibleMintableBurnableInstance.methods.transfer_from(ownerAddress, nonOwnerAddress, 3, {onAccount: nonOwnerAccount});
                    result = await nonFungibleMintableBurnableInstance.methods.owner_of(3);
                    assert.equal(result.decodedResult, nonOwnerAddress);

                    result = await nonFungibleMintableBurnableInstance.methods.get_approved(3);
                    assert.equal(result.decodedResult, undefined);
                });

                it('should handle set_approve_for_all & transfer correctly', async () => {
                    let result = await nonFungibleMintableBurnableInstance.methods.is_approved_for_all(ownerAddress, operatorAddress);
                    assert.isFalse(result.decodedResult);
                    await nonFungibleMintableBurnableInstance.methods.set_approval_for_all(operatorAddress, true, {onAccount: ownerAccount});
                    result = await nonFungibleMintableBurnableInstance.methods.is_approved_for_all(ownerAddress, operatorAddress);
                    assert.isTrue(result.decodedResult);

                    result = await nonFungibleMintableBurnableInstance.methods.owner_of(4);
                    assert.equal(result.decodedResult, ownerAddress);

                    await nonFungibleMintableBurnableInstance.methods.approve(4, nonOwnerAddress, {onAccount: operatorAccount});

                    result = await nonFungibleMintableBurnableInstance.methods.get_approved(4);
                    assert.equal(result.decodedResult, nonOwnerAddress);

                    result = await nonFungibleMintableBurnableInstance.methods.balance_of(operatorAddress);
                    assert.equal(result.decodedResult, 0);
                    await nonFungibleMintableBurnableInstance.methods.transfer_from(ownerAddress, operatorAddress, 4, {onAccount: operatorAccount});
                    result = await nonFungibleMintableBurnableInstance.methods.balance_of(operatorAddress);
                    assert.equal(result.decodedResult, 1);

                    result = await nonFungibleMintableBurnableInstance.methods.get_approved(4);
                    assert.equal(result.decodedResult, undefined);
                });
            });

            describe('Metadata', () => {
                it('should not write token metadata as non owner', async () => {
                    await assertNode.rejects(nonFungibleMintableBurnableInstance.methods.set_token_uri(5, "https://example.token.uri", {onAccount: nonOwnerAccount}), (err) => {
                        assert.include(err.message, "Only token owner can set token uri");
                        return true;
                    });
                });

                it('should write/read token metadata successfully', async () => {
                    let result = await nonFungibleMintableBurnableInstance.methods.get_token_uri(5);
                    assert.equal(result.decodedResult, "");

                    await nonFungibleMintableBurnableInstance.methods.set_token_uri(5, "https://example.token.uri");

                    result = await nonFungibleMintableBurnableInstance.methods.get_token_uri(5);
                    assert.equal(result.decodedResult, "https://example.token.uri");
                });
            });
        });
    });
});