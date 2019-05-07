# Non fungible token example
The Non-fungible tokes are tokens that are not instantly swapable on-to-one. They represent non-equal units of the same sorts. This example allows you to create such token and issue units from it.

## How it works?
Upon deployment, the token sets its owner - the Call.caller (deployer). The owner has special privilege - the ability to create (mint) new tokens. When token is created it is associate with a user - the `tokenOwner`.
The token owner can act upon this token in various ways. They can set it's metadata, transfer it, allow it to be transfered on his/her behalf or completely destroy it.

In addition, the smart contract keeps track of important statistical data - who owns a given token, how many tokens given user possess and how many tokens are there in general.

## Methods description
- `name()` - name of the token contract
- `symbol()` - symbol of the token contract
- `balance_of(token_owner : address)` - returns how many tokens are owned by the inputted address
- `owner_of(token_id' : token_id)` - Returns the address of the owner of token with the supplied id
- `get_approved(token_id' : token_id)` - Returns the address of an user that has been given the rights to transfer the token with this token_id on the behalf of the token owner
- `is_approved_for_all(owner: address, operator : address)` - Returns true of the certain _owner user has approved certain operator address to transact on its behalf with any token.
- `get_token_uri(token_id' : token_id)` - Returns the metadata for a token identified by this tokenId
- `mint(token_id' : token_id, to : address)` - Creates a new token unit with the given ID and assigns its owner to be the address identified by the `to` parameter. Callable only by the contract owner.
- `burn(token_id' : token_id)` - Destroys this token. Callable only by the token owner.
- `approve(token_id' : int, to : address)` - Allows a certain address `to` to represent you for your token identified by `token_id'`. Callable by the tokenOwner only
- `transfer_from(from : address, to : address, token_id' : token_id)` - Allows for an approved representor (trough the use of `approve`) to transfer a token identified by token_id' from its owner to an address identified by `to
- `set_approval_for_all(to : address, approved : bool)` - Allows an address identified by `to` to transact with all your tokens