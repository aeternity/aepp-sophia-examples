# Date and Time Sophia smart contract

## Sophia Date and Time smart contract overview
Sophia contract which implements utilities that eases the work with date-time related job. There is a functionality for getting year, month, day, hour, minute, second and weekday from timestamp and vice versa. 
The contract is made using [forgAE project](https://github.com/aeternity/aepp-forgae-js) with tests included.

## Prerequisites
Ensure that you have installed [forgAE project](https://github.com/aeternity/aepp-forgae-js)

## Clone this repository
```
git clone https://github.com/DanielaIvanova/sophia-contracts.git
cd DateTime
```

## How to start the node localy
`forgae node`

## How to deploy the contract
`forgae deploy`

This command will deploy the contract in the local network.
The configuration of deployment is written in `deploy.js` file.

In our case the output is:
```
===== Contract: DateTime.aes has been deployed =====
{ owner: 'ak_2mwRmUeYmfuW93ti9HMSUJzCk1EYcQEfikVSzgo6k2VghsWhgU',
  transaction: 'th_RT3BTt6eiVNKkgjw2vW1pjFFvQ99SwM4ogQHMDcL5Zdawdnn2',
  address: 'ct_HVb6d4kirgqzY1rShmzRTRwukcsXobjHcpLVD2EggoHmn6wt2',
  call: [Function],
  callStatic: [Function],
  createdAt: 2019-01-11T08:11:11.236Z }
Your deployment script finished successfully!
```

## How to run the tests
`forgae test`

All tests should be passing.

## How to integrate the library with your contract
1. `DateTime` should be deployed and you have to take the address of the contract.

2. You should decode the address to `hex`. You can use `aecli` to decode the address, for example:
```
aecli crypto decode ct_uH2C1ZWkkVeteqrcP6UtQoAwG3TGbsC6uBRgwiF3YdhgDJVmE
```
The output is: 
```
Decoded address (hex): 76b3153fed56f7bca175149e15bcb9e09e5e7df14f128f5c464a70f8e73b57b8
```

3. It should return the address in hex, which now can be used in your contract. You should add `0x` before it to designate it as hex.
```
0x76b3153fed56f7bca175149e15bcb9e09e5e7df14f128f5c464a70f8e73b57b8
```

4. Now you are ready to add some functions from our library in your own smart contract.
```
contract Remote = 
  function get_year : (int) => int

contract YourContract =
  type state = ()
  function main(timestamp : int, remote : Remote) : int = 
    remote.get_year(timestamp)
```
**NOTE:** In this case we will be using `get_year` function from `DateTime` library.

5. Deploy your contract and call `main` function with following arguments: 
```
main(0, 0x76b3153fed56f7bca175149e15bcb9e09e5e7df14f128f5c464a70f8e73b57b8)
```

6. It should return the year of `0` timestamp :
```
Result: 

1970
```

## Implemented functionality
The library contains:
1. `parse_timestamp(timestamp)`
The function takes as argument a timestamp and return a date_time structure. Return type of the function is `(int, int, int, int, int, int, int, int)`.
2. `get_year(timestamp)`
The function takes as argument a timestamp and return the year of the given timestamp. Return type of the function is `int`.
3. `get_month(timestamp)`
The function takes as argument a timestamp and return the month of the given timestamp. Return type of the function is `int`.
4. `get_day(timestamp)`
The function takes as argument a timestamp and return the day of the given timestamp. Return type of the function is `int`.
5. `get_hour(timestamp)`
The function takes as argument a timestamp and return the hour of the given timestamp. Return type of the function is `int`.
6. `get_minute(timestamp)`
The function takes as argument a timestamp and return the minute of the given timestamp. Return type of the function is `int`.
7. `get_second(timestamp)`
The function takes as argument a timestamp and return the second of the given timestamp. Return type of the function is `int`.
8. `get_weekday(timestamp)`
The function takes as argument a timestamp and return the weekday of the given timestamp. Return type of the function is `int`.
9. `to_timestamp(year, month, day, hour, minute, second)`
The function takes as arguments year, month, day, hour, minute, second and return the timestamp. Return type of the function is `int`.
