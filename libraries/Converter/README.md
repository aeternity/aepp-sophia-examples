# BaseConverter Sophia library

## Sophia BaseConverter library overview
This project implements functionality to convert a decimal to binary, octal, hexadecimal base. Also, there is a functionality to convert from binary and octal bases to decimal. At the moment, limitations in Sophia language does not allow us to add hexadecimal to decimal converting functionality.

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
1. `dec_to_binary(decimal)` - Performs decimal to binary conversion. Given argument `decimal` should be represented as an integer. Return type is string.
2. `dec_to_oct(decimal)` - Performs decimal to octal conversion. Given argument `decimal` should be represented as an integer. Return type is string.
3. `dec_to_hex(decimal)` - Performs decimal to hexadecimal conversion. Given argument `decimal` should be represented as an integer. Return type is string.
4. `binary_to_dec(binary)` - Performs binary to decimal conversion. Given argument `binary` should be represented as an integer. Return type is integer.
5. `oct_to_dec(oct)` - Performs octal to decimal conversion. Given argument `oct` should be represented as an integer. Return type is integer.