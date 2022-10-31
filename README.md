# aepp-sophia-examples [![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/aeternity/aepp-sophia-examples)

## AEproject
[AEproject](https://github.com/aeternity/aeproject) is the testing framework for [Sophia](https://aeternity.com/aesophia) Smart Contract development and allows developers to easily run a local dev environment & test their Smart Contracts.

The structure of this repository follows the default structure that AEproject provides if you initialize a new project.

***Note***
- This repository doesn't provide any deployment scripts as it is only intended to showcase Sophia Smart Contracts & how to test those.
- All Sophia examples are provided with corresponding tests written in JavaScript which can be found under [./test](test).

## Standards (Aeternity Expansions) & Implementations
The [Aeternity Expansions](https://github.com/aeternity/AEXs#aeternity-expansions) (AEX) are standards on aeternity proposed by the community. If you have a good idea or face common requirements you can also submit a new AEX proposal for which a reference implementation can be developed.

- [AEX-9: Fungible Token](https://github.com/aeternity/AEXs/blob/master/AEXS/aex-9.md)
    - [Reference Implementation](https://github.com/aeternity/aeternity-fungible-token)
- [AEX-141: Non Fungible Token](https://github.com/aeternity/AEXs/blob/master/AEXS/aex-141.md)
    - [NFT Collection Example Implementation](https://github.com/aeternity/aex141-nft-collection-example)
    - [Simple Marketplace Example Implementation](https://github.com/aeternity/aex141-nft-simple-marketplace)

## Smart Contract Examples

### Disclaimer
***The provided Sophia examples are only tested to the extend represented. None of the code was security audited by aeternity or is provided to be used in production, without thorough checks.***

### Library Usage

The [LibraryUsage.aes](contracts/Libraries/LibraryUsage.aes) contract shows how to include default and custom libraries in a Smart Contract. The example currently includes following custom libraries:
- [BaseConverter.aes](contracts/Libraries/lib/BaseConverter.aes)
- [DateTime.aes](contracts/Libraries/lib/DateTime.aes)

### Delegation signatures
It is possible to delegate the right to perform certain `AENS` or `Oracle` related actions to a contract. Check out the following examples and corresponding tests to see how you can use it:

- [AensDelegation.aes](contracts/DelegationSignature/AensDelegation.aes)
    - Delegation signatures for `AENS` functions can e.g. be used to create an AENS marketplace
- [OracleDelegation.aes](contracts/DelegationSignature/OracleDelegation.aes)

### Oracles

ExchangeOracles
- [ExchangeOracle.aes](contracts/ExchangeOracles/ExchangeOracle.aes) registers an oracle and allows to respond to oracle queries.
- [ExchangeMarket.aes](contracts/ExchangeOracles/ExchangeMarket.aes) showcases how to query prices from an oracle and how to get the answers of an oracle.

SmartDataProvider
- [SmartDataProviderBackendInterface.aes](contracts/SmartDataProvider/SmartDataProviderBackendInterface.aes) defines entrypoints of the SmartDataProviderBackend
- [SmartDataProviderBackend.aes](contracts/SmartDataProvider/SmartDataProviderBackend.aes) the actual implementation of the interface that registers an oracle and processes responses
- [SmartDataProviderClient.aes](contracts/SmartDataProvider/SmartDataProviderClient.aes) the client that uses the interfaces to call the entrypoints of the backend implementation

There also exists another repository [ae-oracle-pricefeed](https://github.com/aeternity/ae-oracle-pricefeed) which includes a complete example that runs a server for the oracle which automatically extends the TTL of the oracle and responds to queries.

An even more complex example which aggregates answers of multiple oracles is included in [tipping-oracle-service](https://github.com/aeternity/tipping-oracle-service). The contracts in this repository are being used by https://superhero.com.

### Smart Shop

This is a good example to see how to deal with contract interfaces to call remote contracts. All contracts can be found under [contracts/SmartShop](contracts/SmartShop).

**Workflow**
1. The Seller deploys the SellerContract by passing the buyer public address and item price as arguments.
1. The Transport Courier deploys the TransportContract passing `location` as an argument.
1. The Buyer passes SellerContract address and TransportContract address as arguments when deploying BuyerContract.
1. The Buyer deposits the needed amount by calling `deposit_to_seller_contract()`, which takes the price of the item as `Call.value`.
1. The Seller now sends the item, which will be redirected to Transport Courier. The function is `send_item()`. It checks if Buyer has deposited the price of the item to the SellerContract.
1. Buyer can track the status of the item:
    - `check_courier_status()` - returns current delivery status
    - `check_courier_location()` - returns current location status
1. Once the item is delivered, the Transport Courier calls `delivered_item(city : string)` function, with current location.
1. To finalize the order, Buyer calls `received_item()` function, with SellerContract address.
1. The amount of tokens, payed by Buyer, will be sent to seller's account.

### Others (no specific explanation provided/required)
- [CryptoHamster.aes](contracts/CryptoHamster/CryptoHamster.aes)
- [Ownable.aes](contracts/Ownable/Ownable.aes)
- [SmartRealEstate.aes](contracts/SmartRealEstate/SmartRealEstate.aes)
- [SpendToMany.aes](contracts/SpendToMany/SpendToMany.aes)
- [TicTacToe.aes](contracts/SpendToMany/SpendToMany.aes)

## Problems / Questions
If you face a problem or have other questions please pick one of the following places:
- https://forum.aeternity.com/c/sophia-smart-contracts/38
- https://stackoverflow.com/questions/tagged/aeternity-blockchain
- [æternity Discord / Sophia Channel](https://discord.gg/HP6BMvBEdb)

We are happy to help!
