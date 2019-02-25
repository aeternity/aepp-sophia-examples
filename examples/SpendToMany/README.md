# Spend-to-Many Sophia example

## Sophia Spend-to-Many contract example overview
This contract allows user to spend tokens to another accounts, by just calling `spend_to_many(map_of_users)` function. 

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
`spend_to_many(map)` - the function which takes a `map(address,int)`, where `address` is a `public key`(address) of recipient and `int` is the `amount` of tokens which are going to be transferred. Return type is `int`, which, in successful case, will return the total amount of spent tokens.
  - The function will iterate through each key(`address`) and value(`amount_of_tokens`) of the given map(which is transformed to a list of tuples), trying to call a `Contract.spend(address,amount_of_tokens)` function at each iteration. There are also checks for the balance and each time contract tries to `Contract.spend(address,tokens)` . Unsuccessful calls will be interrupted by `require(condition, error_message)`. Excess tokens will be sent back to caller, in order to prevent contract balance theft.