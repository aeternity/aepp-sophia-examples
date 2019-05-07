

# Fungible token example
Fungible token is a technical standard used for smart contracts on the blockchain for implementing tokens. Fungible token defines a common list of rules for tokens to follow within the larger ecosystem, allowing developers to accurately predict interaction between tokens. These rules include how the tokens are transferred between addresses and how data within each token is accessed. Fungible tokens are interchangeable, divisible, and identical tokens that are useful as money.

## How it works?
Upon deployment, the token sets its owner - the Call.caller (deployer). The owner has special privilege - the ability to create (mint) new tokens. When token is created it is associated with a user - the `account` parameter.
The token owner can act upon their tokens in various ways. They can set transfer it, allow it to be transferred on his/her behalf or completely destroy it.

In addition, the smart contract keeps track of important statistical data - who owns a given token, how many tokens given user possess and how many tokens are there in general.

## Methods description

```
record state = {
     owner            : address, 
     total_supply      : int,
     balances         : map(address, int),
     allowed          : map((address,address), int)}
```

Тhe state describes the state variables, which must be set when initializing the smart contract, and can be changed  afterwards.

```
   public stateful function init() = {
     owner = Call.caller,
     total_supply = 0,
     balances = {},
     allowed = {}}
```

The **init** function is called once, when the contract is deployed, and only the owner of the contract is set to the address that deploys the smart contract.

```
   public function total_supply() : int = state.total_supply
```

Function which returns the total supply of this Fungible tokens

```
   public function balance_of(who: address) : int = Map.lookup_default(who, state.map_balances, 0)
```

Returns the token balance of the address that is passed as an argument

```
  public function allowance(owner: address, spender: address) : int = 
    Map.lookup_default((owner, spender), state.map_allowed, 0)
 ```
The **allowance** function returns the amount of tokens approved by the owner that can be spend by the spender.

```
  public stateful function transfer(to: address, value: int) =
    transfer'(Call.caller, to, value)
```

The **transfer** function transfers the value passed as an argument, to the to address also passed as an argument from the owner’s wallet.

```
  public stateful function approve(spender: address, value: int) = 
    require(value > 0, "Value is sub zero")
    require(spender != #0, "Invalid spender address")

    put(state{map_allowed[(Call.caller,spender)] = value})
```

In the approve function, the owner approves that the **spender** can spend the **value** of tokens. 

```
  private stateful function transfer'(from: address, to: address, value: int) =
    require(value > 0, "Value is sub zero")
    require(value =< balance_of(from), "Not enough balance")
    require(to != #0, "Invalid address")
      
    put(state{
      map_balances[from] = balance_of(from) - value,
      map_balances[to] = balance_of(to) + value })
```

Internal function that is called from the **transfer** function. It’s purpose is to change the values of the state variables and actually make the transfer of tokens between accounts.

```
  public stateful function transfer_from(from: address, to: address, value: int) =
    require(Map.lookup_default((from, Call.caller), state.map_allowed, 0) >= value, "Value is bigger than allowed")

    put(state{map_allowed[(from, Call.caller)] = Map.lookup_default((from, Call.caller), state.map_allowed, 0) - value}) 
    transfer'(from, to, value)
```
**transfer_from** function transfers tokens between two accounts.  The accounts that will send tokens must have the value in tokens approved, the allowance of the account must be greater than the value. The balance too.

```
  public stateful function increase_allowance(spender: address, added_value: int) =
    require(spender != #0, "Invalid address")
    put(state{map_allowed[(Call.caller, spender)] = state.map_allowed[(Call.caller,spender)] + added_value})

  public stateful function decrease_allowance(spender: address, subtracted_value: int) =
    require(spender != #0, "Invalid address")
    put(state{map_allowed[(Call.caller,spender)] = state.map_allowed[(Call.caller,spender)] - subtracted_value})
```
The two functions are used to **increase** and **decrease** the allowance, respectively, of a given wallet with the given value.

```
  public stateful function mint(account: address, value: int) =
    only_owner()
    require(account != #0, "Invalid address")

    put(state{total_supply = state.total_supply + value,
          map_balances[account] = balance_of(account) + value})
```

The **mint** function is used to create tokens and **increase** the balance of a given user wallet.

```
  public stateful function burn(value: int) =
    require(balance_of(Call.caller) >= value, "Burned amount is less than account balance")

    put(state{total_supply = state.total_supply - value,
          map_balances[Call.caller] = balance_of(Call.caller) - value})
```
The **burn** function is the opposite of the mint, it is used to **decrease** the token balance of a user, and destroy the tokens.

The following functions, are helpers. There are error handling functions like **require**,  and the **only_owner**, that demands that only the owner of the contract can call specific functions of a smart contract.
```

  private function require(expression : bool, error : string) =
    if(!expression) 
      abort(error)

  private function only_owner() =
      require(Call.caller == state.owner, "Only owner can mint!")
```