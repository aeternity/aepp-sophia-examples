# List Library Sophia Smart Contract

Defines list functions that you would expect to find in a standard library for any functional programming language.

## Usage

Copy needed functions in your code or deploy as standalone library similar to explained in https://github.com/aeternity/aepp-sophia-examples/blob/master/libraries/DateTime/README.md

After the minerva hardfork it will be possible to use this code as namespace as well.

## Tests

Testing using forgae is very limited for this example, as there is currently no option to pass functions as arguments using the node api

## Implemented functions

more detailed typespecs are found in the code

 - `size(list): int`
 - `map(function, list): list`
 - `foldr(function, intitial_value, list): value`
 - `foldl(function, intitial_value, list): value`
 - `filter(function, list): list`
 - `find(function, list): option(value)`
 - `sum(function, list): int`
 - `reverse(list): list`
 - `insert_by(function, value, list): list`
