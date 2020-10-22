# Date and Time Sophia smart contract

## Sophia Date and Time smart contract overview
Sophia contract which implements utilities that eases the work with date-time related job. There is a functionality for getting year, month, day, hour, minute, second and weekday from timestamp and vice versa. 
The contract is made using [AEProject project](https://github.com/aeternity/aepp-aeproject-js) with tests included.

## Prerequisites
Ensure that you have installed [AEProject project](https://github.com/aeternity/aepp-aeproject-js)

## Clone this repository
```
git clone https://github.com/aeternity/aepp-sophia-examples.git
cd libraries/DateTime
```

## How to start the node and compliler localy
`aeproject env`

## How to deploy the contract
`aeproject deploy`

This command will deploy the contract in the local network.
The configuration of deployment is written in `deploy.js` file.

In our case the output is:
```
===== Contract: DateTime.aes has been deployed =====
===== Contract: DateTimeLibraryContract.aes has been deployed =====
===== Contract: DateTimeWithLibrary.aes has been deployed =====
Your deployment script finished successfully!
```

## How to run the tests
`aeproject test`

All tests should be passing.

## How to integrate the library with your contract

There are three ways you could use DateTime in your smart contract, therefore the different implementations are separated in files. Final outcome is equal. These are the following methods:
  - by deploying it on a network
  - split DateTime as library using the namespace construct
  - split DateTime as library using another contract

### Deploy DateTime to network
1. `DateTime.aes` should be deployed
2. Now you are ready to call the contract entrypoints

### DateTime as library using the namespace construct
1. Use it as a namespace at the top-level of your smart contract as it is in `DateTimeWithInclude.aes`
2. You should now be able to access all public functionalities of the library
```
include "DateTimeLibrary.aes"
contract DateTimeWithInclude =
  entrypoint get_year(timestamp : int) : int = 
    Date.get_year(timestamp)
```
3. Deploy the `DateTimeWithInclude.aes` contract 
4. Now you are ready to call the contract entrypoints using the `Date` namespace from the `DateTimeLibrary.aes` library

### DateTime as library using another contract
1. `DateTimeLibraryContract.aes` should be deployed and you have to take the address of the contract.
2. Now you are ready to add some entrypoints from our library in your own smart contract.
```
contract DateLibrary =
  entrypoint get_year : (int) => int

contract YourContract =
  record state = { date : DateLibrary }

  entrypoint init(date_contract : DateLibrary) : state =
    { date = date_contract }
  
  entrypoint get_year(timestamp : int) : int = 
    state.date.get_year(timestamp)
```
**NOTE:** In this case we will be using `get_year` entrypoint from `DateLibrary` library contract.
3. Deploy your contract and call `init` entrypoint with the `DateTimeLibraryContract.aes` contract address as an argument
4. Now you are ready to call the `get_year` entrypoints from the `DateTimeLibraryContract.aes` contract library

## Implemented functionality
The library contains:
1. `parse_timestamp(timestamp)`
The entrypoint takes as argument a timestamp and return a date_time structure. Return type of the entrypoint is `(int, int, int, int, int, int, int, int)`.
2. `get_year(timestamp)`
The entrypoint takes as argument a timestamp and return the year of the given timestamp. Return type of the entrypoint is `int`.
3. `get_month(timestamp)`
The entrypoint takes as argument a timestamp and return the month of the given timestamp. Return type of the entrypoint is `int`.
4. `get_day(timestamp)`
The entrypoint takes as argument a timestamp and return the day of the given timestamp. Return type of the entrypoint is `int`.
5. `get_hour(timestamp)`
The entrypoint takes as argument a timestamp and return the hour of the given timestamp. Return type of the entrypoint is `int`.
6. `get_minute(timestamp)`
The entrypoint takes as argument a timestamp and return the minute of the given timestamp. Return type of the entrypoint is `int`.
7. `get_second(timestamp)`
The entrypoint takes as argument a timestamp and return the second of the given timestamp. Return type of the entrypoint is `int`.
8. `get_weekday(timestamp)`
The entrypoint takes as argument a timestamp and return the weekday of the given timestamp. Return type of the entrypoint is `int`.
9. `to_timestamp(year, month, day, hour, minute, second)`
The entrypoint takes as arguments year, month, day, hour, minute, second and return the timestamp. Return type of the entrypoint is `int`.
10. `is_leap_year(year)`
The entrypoint takes as argument year and check if it is leap or not. Return type of the entrypoint is `bool`.
11. `add_years(timestamp, years)`
The entrypoint takes as arguments timestamp and year and ends up adding those years to the provided timestamp. Return type of the entrypoint is `int`.
12. `sub_years(timestamp, years)`
The entrypoint takes as arguments timestamp and year and ends up substracting those years from the provided timestamp. Return type of the entrypoint is `int`.
13. `add_months(timestamp, months)`
The entrypoint takes as arguments timestamp and months and ends up adding those months to the provided timestamp. Return type of the entrypoint is `int`.
14. `sub_months(timestamp, months)`
The entrypoint takes as arguments timestamp and months and ends up substracting those months from the provided timestamp. Return type of the entrypoint is `int`.
15. `add_days(timestamp, days)`
The entrypoint takes as arguments timestamp and days and ends up adding those days to the provided timestamp. Return type of the entrypoint is `int`.
16. `sub_days(timestamp, days)`
The entrypoint takes as arguments timestamp and days and ends up substracting those days from the provided timestamp. Return type of the entrypoint is `int`.
17. `add_hours(timestamp, hours)`
The entrypoint takes as arguments timestamp and hours and ends up adding those hours to the provided timestamp. Return type of the entrypoint is `int`.
18. `sub_hours(timestamp, hours)`
The entrypoint takes as arguments timestamp and hours and ends up substracting those hours from the provided timestamp. Return type of the entrypoint is `int`.
19. `add_minutes(timestamp, minutes)`
The entrypoint takes as arguments timestamp and minutes and ends up adding those minutes to the provided timestamp. Return type of the entrypoint is `int`.
20. `sub_minutes(timestamp, minutes)`
The entrypoint takes as arguments timestamp and minutes and ends up substracting those minutes from the provided timestamp. Return type of the entrypoint is `int`.
21. `add_seconds(timestamp, seconds)`
The entrypoint takes as arguments timestamp and seconds and ends up adding those seconds to the provided timestamp. Return type of the entrypoint is `int`.
22. `sub_seconds(timestamp, seconds)`
The entrypoint takes as arguments timestamp and seconds and ends up substracting those seconds from the provided timestamp. Return type of the entrypoint is `int`.
23. `diff_years(from_timestamp, to_timestamp)`
The entrypoint takes as arguments two timestamps for comparison and provides the difference between them in years. First timestamp must be smaller. Return type of the entrypoint is `int`.
24. `diff_months(from_timestamp, to_timestamp)`
The entrypoint takes as arguments two timestamps for comparison and provides the difference between them in months. First timestamp must be smaller. Return type of the entrypoint is `int`.
25. `diff_days(from_timestamp, to_timestamp)`
The entrypoint takes as arguments two timestamps for comparison and provides the difference between them in days. First timestamp must be smaller. Return type of the entrypoint is `int`.
26. `diff_hours(from_timestamp, to_timestamp)`
The entrypoint takes as arguments two timestamps for comparison and provides the difference between them in hours. First timestamp must be smaller. Return type of the entrypoint is `int`.
27. `diff_minutes(from_timestamp, to_timestamp)`
The entrypoint takes as arguments two timestamps for comparison and provides the difference between them in minutes. First timestamp must be smaller. Return type of the entrypoint is `int`.
28. `diff_seconds(from_timestamp, to_timestamp)`
The entrypoint takes as arguments two timestamps for comparison and provides the difference between them in seconds. First timestamp must be smaller. Return type of the entrypoint is `int`.
29. `is_valid_date(year, month, day)`
The entrypoint takes as arguments year, month, day and checks if the provided data could form a valid date. Return type of the entrypoint is `bool`
30. `is_valid_date_time(year, month, day, hour, minute, second)`
The entrypoint takes as arguments year, month, day, hour, minute, second and checks if the provided data could form a valid date time. Return type of the entrypoint is `bool`
31. `is_week_day(timestamp)`
The entrypoint takes as argument timestamp and check if the day of the week is between Monday and Friday. Return type of the entrypoint is `bool`
32. `is_week_end(timestamp)`
The entrypoint takes as argument timestamp and check if the day of the week is Saturday or Sunday. Return type of the entrypoint is `bool`