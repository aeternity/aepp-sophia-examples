# SmartBank Sophia contract

## Sophia SmartBank contract overview
This project is a simple Smart Sophia Contract Bank implementation. It has capabilities to store, manage, remove accounts and tokens. Sophia Smart Bank contract uses password hashing for improved security.
State of the contract consists of account's public key and a record with password's hash and amount of tokens.
To deposit some tokens, you should pass a `password`. If the account still does not exist in the state of contract, will be created and stored the new account record. If the account already exists, the amount of tokens will be added to the account's record.
The password will be used everytime on each token-related operation. Tokens should be added in contract call's `amount` field.
There is a functionality to transfer tokens, check balance and remove accounts.

## Prerequisites
Ensure that you have installed [forgAE project](https://github.com/aeternity/aepp-forgae-js)

## How to deploy the contract
`forgae deploy`

This command will deploy the contract in the local network.
The configuration of deployment is written in `deploy.js` file.

## How to run the tests
`forgae test`

All tests should be passing.

## Implemented functionality
1. `deposit(pass)` - the function takes an argument `pass` as a string. There is no return type of the function.
2. `withdraw(pass, amount)` - the function takes 2 arguments - `pass` as a string and `amount` as an integer. The function will transfer the given amount of tokens to the owner of the account. There is no return type of the function.
3. `transfer(address, pass, amount)` - the function takes 3 arguments - `address` as the public key of the account in hexadecimal format, where the tokens should be sent to, `pass` as a string and `amount` as an integer. The function will try to transfer the given amount of tokens from the caller's account.
4. `remove_self()` - the function takes no arguments. It will try to remove caller's account from the state, but before that, it will try to send the amount of tokens held in the state, to its owner. There is no return type of the function.
5. `user_exists(user)` - the function takes `user` argument, which is account's address in hexadecimal format. It will check if the given address exists in the state. The return type is `boolean`.
6. `check_self_balance()` - the function takes no arguments. It checks the caller's account balance. The return type is `integer`. 