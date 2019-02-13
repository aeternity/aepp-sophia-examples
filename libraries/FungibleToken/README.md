

# Fungible token example
Fungible token is a technical standard used for smart contracts on the blockchain for implementing tokens. Fungible token defines a common list of rules for tokens to follow within the larger ecosystem, allowing developers to accurately predict interaction between tokens. These rules include how the tokens are transferred between addresses and how data within each token is accessed. Fungible tokens are interchangeable, divisible, and identical tokens that are useful as money.

## How it works?
Upon deployment, the token sets its owner - the Call.caller (deployer). The owner has special privilege - the ability to create (mint) new tokens. When token is created it is associate with a user - the `account` parameter.
The token owner can act upon their tokens in various ways. They can set transfer it, allow it to be transfered on his/her behalf or completely destroy it.

In addition, the smart contract keeps track of important statistical data - who owns a given token, how many tokens given user possess and how many tokens are there in general.

## Methods description

```
record state = {
     _owner            : address, 
     _totalSupply      : int,
     _balances         : map(address, int),
     _allowed          : map((address,address), int)}
```

Тhe state describes the state variables, which must be set when initializing the smart contract, and can be changed  afterwards.

```
   public stateful function init() = {
     _owner = Call.caller,
     _totalSupply = 0,
     _balances = {},
     _allowed = {}}
```

The **init** function is called once, when the contract is deployed, and only the owner of the contract is set to the address that deploys the smart contract.

```
   public function totalSupply() : int = state._totalSupply
```

Function which returns the total supply of this Fungible tokens

```
   public function balanceOf(who: address) : int = lookupByAddress(who, state._balances, 0)
```

Returns the token balance of the address that is passed as an argument

```
   public function allowance(owner: address, spender: address) : int = 
     switch(Map.lookup((owner, spender), state._allowed))
 	    None    => 0
 	    Some(x) => x
 ```
The **allowance** function returns the amount of tokens approved by the owner that can be spend by the spender.

```
   public stateful function transfer(to: address, value: int) : bool =
     _transfer(Call.caller, to, value)
```

The **transfer** function transfers the value passed as an argument, to the to address also passed as an argument from the owner’s wallet.

```
   public stateful function approve(spender: address, value: int) : bool = 
     require(value > 0, "Value is sub zero")
     require(spender != #0, "Invalid spender address")

     put(state{_allowed[(Call.caller, spender)] = value})

     true
```

In the approve function, the owner approves that the **spender** can spend the **value** of tokens. 

```
   private stateful function _transfer(from: address, to: address, value: int) : bool =
     require(value > 0, "Value is sub zero")
     require(value =< balanceOf(from), "Not enough balance")
     require(to != #0, "Invalid address")
       
     put(state{
       _balances[from] = sub(balanceOf(from), value),
       _balances[to] = add(balanceOf(to), value)})

     true
```

Internal function that is called from the **transfer** function. It’s purpose is to change the values of the state variables and actually make the transfer of tokens between accounts.

```
public stateful function transferFrom(from: address, to: address, value: int) : bool =
     require(state._allowed[(from, Call.caller)] >= value, "Value is bigger than allowed")
     
     put(state{_allowed[(from, Call.caller)] = sub(state._allowed[(from, Call.caller)], value)})
     _transfer(from, to, value)

     true
```
**TransferFrom** function transfers tokens between two accounts.  The accounts that will send tokens must have the value in tokens approved, the allowance of the account must be greater than the value. The balance too.

```
   public stateful function increaseAllowance(spender: address, addedValue: int) : bool =
     require(spender != #0, "Invalid address")
     put(state{_allowed[(Call.caller, spender)] = add(state._allowed[(Call.caller,spender)], addedValue)})

     true

   public stateful function decreaseAllowance(spender: address, subtractedValue: int) : bool =
     require(spender != #0, "Invalid address")
     put(state{_allowed[(Call.caller,spender)] = sub(state._allowed[(Call.caller,spender)], subtractedValue)})

     true
```
The two functions are used to **increase** and **decrease** the allowance, respectively, of a given wallet with the given value.

```
 public stateful function mint(account: address, value: int) : bool =
     onlyOwner()
     require(account != #0, "Invalid address")

     put(state{_totalSupply = add(state._totalSupply, value),
           _balances[account] = add(balanceOf(account), value)})

     true
```

The **mint** function is used to create tokens and **increase** the balance of a given user wallet.

```
   public stateful function burn(value: int) : bool =
     require(balanceOf(Call.caller) >= value, "Burned amount is less than account balance")

     put(state{_totalSupply = sub(state._totalSupply, value),
           _balances[Call.caller] = sub(balanceOf(Call.caller), value)})

     true
```
The **burn** function is the opposite of the mint, it is used to **decrease** the token balance of a user, and destroy the tokens.

The following functions, are helpers. There are **math** functions for easy calculations, error handling functions like **require**,  and the **onlyOwner**, that demands that only the owner of the contract can call specific functions of a smart contract.
```
 private function add(_a : int, _b : int) : int =
     let c : int = _a + _b
     require(c >= _a, "Error")
     c

   private function sub(_a : int, _b : int) : int =
     require(_b =< _a, "Error")
     _a - _b

   private function require(b : bool, err : string) =
     if(!b) 
       abort(err)

   private function onlyOwner() =
       require(Call.caller == state._owner, "Only owner can mint!") 
```

## Using Fungible Token

 You can start using the Fungible token contract, but first you need to install aecli-js. This can be done using the following command: 
```
npm install --global @aeternity/aecli-js
```
More info about the cli, can be found here :

https://github.com/aeternity/aecli-js

## Compilation
When you have installed the cli, first thing to do is to compile the Fungible token contract.
The contact can be compiled using the compile command of the cli.  The compile commands has one parameter, the file (smart contract) that you want to compile.

Here is an example of a compilation of a Fungible token smart contract:
```
aecli contract compile fungible-token.aes 
Contract bytecode:
      cb_e5cS8Kurqurd6Tcp4tDNPcHi6ezzEt6dMXDNsNX5VGhifxRt8mwdQ9vhtczKwag4YeGyaGhruDE5YeDY7AMY7VYJqAScgREqXedjfyBuSVSLUWjiKsU3SDTY3be99qrRkShrgY5R7NGfpReAvAUi8e2PEYi3LXfpqDB6Gz8xGk3vBRhdndKvhcXMPjawdBJgd443L4L1eSRetSaUsabh2T8Zn1GyRjSBJJ6yfeTuSkmmiECsYanrqcvM3mPwxfavaHbc1TtQNx6SuLKYmgZL9vevgVfntVE6srUgLJqb1U4dHzTG8yVLNWZ9CjhyPkfJxJYsfr2iKMmgze4qKSwm1Jp1MCc...
```

## Deployment
The output of the compilation is the compiled bytecode of the contract. Which will be needed for later interactions with the smart contract

After the contract is compiled, it can be deployed. The default network to deploy (currently) is the edge net ("https://sdk-edgenet.aepps.com"). For deploying a smart contract you should have already created wallet (account), from which the deployment will be triggered. If you don’t have, you can create one with the following command:  

aecli account create <wallet_name>

The command to deploy the smart contract is 
aecli contract deploy <wallet_path> <contract_path>

## Interacting
To be able to interact with a smart contrac, first is should be deployed on a network. 

The **cli** command used to interact with a given smart contract is
```
aecli contract call [options] <wallet_path> <fn> <return_type> [args...] 
```