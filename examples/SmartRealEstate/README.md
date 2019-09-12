# SmartRealEstate Sophia contract

## Sophia SmartRealEstate contract overview
This project implements basic back-end functionality for managing real estate. 

This smart contract has functionality to add a new owner, add a new owner to a new property, add a new property, changing and removing owners and owner's properties. When the contract is deployed, there will be a default record, where the deployer's key will be the owner of some predefined property.

## Prerequisites
Ensure that you have installed [AE project](https://github.com/aeternity/aepp-aeproject-js)

## How to deploy the contract
`aeproject deploy`

This command will deploy the contract in the local network.
The configuration of deployment is written in `deploy.js` file.

## How to call functions with `owner` address as argument
You should decode the address to `hex`. You can use `aecli` to decode the address, for example:
```
aecli crypto decode ak_6A2vcm1Sz6aqJezkLCssUXcyZTX7X8D5UwbuS2fRJr9KkYpRU
```
The output is: 
```
Decoded address (hex): 0bb4ed7927f97b51e1bcb5e1340d12335b2a2b12c8bc5221d63c4bcb39d41e61
```

It should return the address in hex, which now can be used in your contract. You should add `0x` before it to designate it as hex.
```
0x0bb4ed7927f97b51e1bcb5e1340d12335b2a2b12c8bc5221d63c4bcb39d41e61
```

## How to run the tests
`aeproject test`

All tests should be passing.

## Implemented functionality
1. ` init(price, name, address)` - function initializes the state of SmartRealEstate. It takes `price`, `name`, and `address` and initializes the state with given arguments.
2. `pay_rent(owner, name)` - function performs payment action. This function takes `owner` as a key of owner of the estate and a `name`, which is the name of owner's estate. Both `owner` and `name` should exist in the state of the smart contract and Contract's balance should be more or equal to the price needed to perform payment.
3. `add_owner(name, price, address)` - function, which simply just adds contract caller's key to the state of the contract as the owner key. Requires owner's key to be unique as there can be only one owner in the state which can have multiple properties. Takes `name`,`price`,`address`, creates a new record with given arguments and assigns it to the owner's key.
4. `delete_owner()` - function, which performs a removal of owner's key(caller's key in our case) from the state. Requires owner to be present in the state before it's removal, otherwise will just return an error.
5. `add_property(name, price, address)` - function, which adds a new property to the owner(caller's key). It takes ` name`, `price` and `address` of the property and adds it to the owner. Requires the `name` of property to be unique, otherwise, will rise an error.
6. `delete_property(name)` - function, which removes a property from the owner(caller's key).Takes the `name` of the property. Requires owner(caller) to have exact same name of the property in his record, otherwise will rise an error.
7. `change_address(name, address)`- function, which takes 2 arguments: `name` and `address` as new address of the given property. Requires caller to be an owner of the given `name` .
8. `change_price(name, price)`- function, which takes 2 arguments: `name` and `price` as new price of the given property. Requires caller to be an owner of the given `name` . 
9. `change_tenant(name, tenant)`- function, which takes 2 arguments: `name` and `tenant` as new tenant of the given property. Requires caller to be an owner of the given `name` . 
10. `get_payment_status(owner, name)`- function, which takes 2 arguments: `owner` and `name` of owner's property. Requires owner to have given property. It will return the payment status of this property.
11. `get_property_address(owner, name)`- function, which takes 2 arguments: `owner` and `name` of owner's property. Requires owner to have given property. It will return the address of this property.
12. `get_tenant(owner, name)`- function, which takes 2 arguments: `owner` and `name` of owner's property. Requires owner to have given property. It will return the tenant of this property.
13. `get_price(owner, name)` - function, which takes 2 arguments: `owner` and `name` of owner's property. Requires owner to have given property. It will return the price of this property.
