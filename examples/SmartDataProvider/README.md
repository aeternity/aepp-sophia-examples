# SmartDataProvider Sophia example

## Sophia SmartDataProvider example overview
This example implements 2 contracts and 2 behaviours- client-side and server-side.
#### Client contract's behaviour:
Client asks for the data (in our case - simply hardcoded exchange rates), the server, which uses oracles to provide an information (currently hardcoded).
#### Server contract's behaviour: 
When server contract is deployed, contract's address will be registered as an oracle in Aeternity blockchain. The information(in our case - exchange rates) and contracts key are also initialized and stored at the time of contract initialization. 
Server makes validations of the request and returns a requested data.

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
#### Client-side function:
1. `get_exchange_rate(oracle_interface, currency)` - the function takes 2 arguments - `oracle_interface` which is the server-side contract's address and `currency` which is the name of currency. The return type of this function is a `string`. 
#### Server-side functions: 
1. `get_oracle_address()` - the function which returns the oracle address. Return type is `Address`.
2. `process_response(oracle, query)` - the function starts processing user's request, `oracle` is the key of the oracle, registered in a state of the server's contract and the `query` which is a request to the server. Return type is `string`. 