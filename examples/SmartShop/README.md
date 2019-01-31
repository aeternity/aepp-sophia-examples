# SmartShop Sophia smart contract

## Sophia SmartShop smart contract overview
This project implements basic **Seller**, **Buyer** and **Transport** behaviors. 
1. **SellerContract** implements the following functions: 
- `send_item()` - check if the buyer deposit the price needed to the sellers contract and passes to the transport courier.
- `received_item()` - the function has to be called from Buyer contract when the item is received.

2. **BuyerContract** implements following functions: 
- `deposit_to_seller_contract(price : int, key : address)` - the passing arguments are the price of the item and seller's contract address. 
There are functions implemented in Transport and Seller contracts, that we can call from Buyer contract, to check status of the item:
- `check_courier_status(transport_contract_address : address)` - will return the status of the order.
- `check_courier_location(transport_contract_address : address)` - will return the current location of the order.
- `check_courier_timestamp(transport_contract_address : address)` - will return the timestamp of last update.

3. **TransportContract** implements following functions:
- `change_location(timestamp : int, city : string)` - updates last location of the item and the timestamp.
- `delivered_item(timestamp : int, city : string)` - finishes the delivery process of the item.
- `check_courier_status()` - returns current delivery status.
- `check_courier_location` - returns current location status.
- `check_courier_timestamp()` - returns last updated timestamp.

## Workflow
1. The Buyer shoud deploy the BuyerContract first.
2. The seller shoud pass buyer contract address and price of the item as arguments when deploying SellerContract. 
**Note**: The contract address should be decoded to `hex`. If you have [`aecli`](https://github.com/aeternity/aepp-cli-js) installed you can use the following command:
```
aecli crypto decode ct_2khXXwY54S2Aymh72fifRF9SrLGRpgqSpdvCEfys3aneYHn2uP
```
The output:
```
Decoded address (hex): f217c926bc5debf0e9a42b263ba2a8cddd7c49cc85631630632b272d0db85bdf
```
Then, prepend `0x` to it:
```
0xf217c926bc5debf0e9a42b263ba2a8cddd7c49cc85631630632b272d0db85bdf
``` 

3. The Buyer should deposit the needed amount, by calling `deposit_to_seller_contract(price, address)`, which takes 2 arguments : `seller_contract_address` and `price_of_the_item`. The price is set by  the seller.

4. The seller now should send the item, which will be redirected to transport courier. The function is `send_item()`. It checks if buyer had deposited the price of the item to the seller's contract.

5. Transport courier should deploy the TransportContract passing current `timestamp` and `location` as arguments. 

6. Buyer can track the status of the item:

- `check_courier_status(transport_contract_address : address)` - returns current delivery status 
- `check_courier_location(transport_contract_address : address)` - returns current location status
- `check_courier_timestamp(transport_contract_address : address)` - returns last updated timestamp

7. Once the item is delivered, the courier should call `delivered_item(timestamp : int, city : string)` function, with current `timestamp` and `location`.

8. To finalize the order, buyer should call `received_item(buyer_contract_address)` function, with BuyerContract address.

The amount of tokens, payed by buyer, will be sent to seller's account.
