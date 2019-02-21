# TicTacToe Sophia example

## Sophia TicTacToe example overview
TicTacToe is a game with 2 players. There is a board which looks like something like this:

|[]()|[]()|[]()|
|----|----|----|
| 11 | 12 | 13 |
| 21 | 22 | 23 |
| 31 | 32 | 33 |

*Figure 1*

The player who succeeds in placing three of their marks in a horizontal, vertical, or diagonal row wins the game.

## Gameplay
- First player calls function `make_move(position,player)` with `player` which is player's digit -> `1` and `position`  which is one of the coordinates from *Figure 1*. Then, the given position will be binded to player 1 and will return message `Game continues. The other player's turn`.
- Second player calls function `make_move(position,player)` with  which is player's digit -> `2` and`position` which is one of the coordinates from *Figure 1*. Then, the given position will be binded to player 2 and will return message `Game continues. The other player's turn`.
- If the given coordinate is already taken, the code will throw an error `Place is already taken!`.
- If the given coodrinate does not exist or not allowed, the code will throw an error `Incorrect position!`.
- If the player 1 will try to make another consequtive turn, the code will throw an error ` It's not your turn. Player 2 have to play now!`, same applies for player 2.
- After all positions are taken and if there is no winner, the code will throw `Game is over. Nobody won!`

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
1. `player_1(position)` - the function takes an argument `position` as an integer. The return type is `string`. 
2. `player_2(position)` - the function takes an argument `position` as an integer. The return type is `string`. 
