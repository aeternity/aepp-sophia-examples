# SmartShop Sophia smart contract

## Sophia SmartShop smart contract overview
This project implements basic **Seller**, **Transport** and **Buyer** behaviors. 
1. **SellerContract** implements the following functions: 
- `send_item()` - check if the buyer deposit the price needed to the sellers contract and passes to the transport courier.
- `received_item()` - the function has to be called from Buyer contract when the item is received.

2. **TransportContract** implements following functions:
- `change_location(city : string)` - updates last location of the item and the timestamp.
- `delivered_item(city : string)` - finishes the delivery process of the item and updates the timestamp.

3. **BuyerContract** implements following functions: 
- `deposit_to_seller_contract(seller : SellerInterface)` - the passing argument is the seller's contract address.

There are functions implemented in Transport and Seller contracts, that we can call from Buyer contract, to check status of the item:
- `received_item(seller : SellerInterface)` - will change the item status to _delivered_ and send the deposited price to the seller.
- `seller_contract_balance(seller : SellerInterface)` - will return deposited price of the order.
- `check_item_status(seller : SellerInterface)` - will return the item status of the order.
- `check_courier_status(transport : TransportInterface)` - will return the courier delivery status of the order.
- `check_courier_location(transport : TransportInterface)` - will return the current delivery location of the order

## Workflow
1. The Buyer shoud deploy the BuyerContract first.
2. The Transport Courier should deploy the TransportContract passing `location` as an argument.  
3. The Seller shoud pass buyer owner address(publicKey) and price of the item as arguments when deploying SellerContract.
4. The Buyer should deposit the needed amount, by calling `deposit_to_seller_contract(seller : SellerInterface)`, which takes an arguments of the seller_contract_address and price of the item as `Call.value`.
5. The seller now should send the item, which will be redirected to transport courier. The function is `send_item()`. It checks if buyer had deposited the price of the item to the seller's contract.
6. Buyer can track the status of the item:
- `check_courier_status(transport : TransportInterface)` - returns current delivery status 
- `check_courier_location(transport : TransportInterface)` - returns current location status
7. Once the item is delivered, the courier should call `delivered_item(city : string)` function, with current `location`.
8. To finalize the order, buyer should call `received_item(seller : SellerInterface)` function, with SellerContract address.

The amount of tokens, payed by buyer, will be sent to seller's account.