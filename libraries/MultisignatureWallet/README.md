# Multi-signature wallet example
Multi-signature wallets are a common design pattern in the blockchain world. It allows for multiple parties to be jointly in control of a smart contract and execute it functions - be it sending tokens or calling other contracts methods.

## How it works?
Upon deployment, the wallet sets its owner - the Call.caller (deployer). The owner has special privileges - he/she can add new owners, vote for the addition of new owner, change the required votes and configuration of the wallet, propose transactions and vote to approve/reject such transactions.

The owner sets the minimum required votes in order for execution to go through. For example if there are 5 owners (the original owner and 4 more), the original owner might set the required votes to 3. If 3 of the 5 owners approve a transaction execution - it goes through.

Much like execution of transactions, the addition of owners is also subject of vote.

## Methods description
- `function init_owner(owner : address)` - function used before wallet is set to configured in order to add additional owners by the deployer.
- `function configure()` - marks the wallet as set and functional. Further additions of owners can only be done through voting
- `function vote_change_requirement(new_required: int, vote: bool)` - changes how many votes of the owners are needed for transaction to go through
- `function vote_add_owner(owner : address)` - Votes for addition of the `owner` address as owner of this multisig wallet. Callable only by current owners.
- `function vote_remove_owner(owner : address)` - Votes for removal of the `owner` address from this multisig wallet. Callable only by current owners.
- `function add_transaction(method : string)` - Proposes a certain transaction method to be called by the multisig wallet. Returns txId that needs to be passed to the approve function. Only executable by an owner.
- `function approve(tx_id: int, voting_contract: Voting)` - votes for the execution of transaction identified by this txId. If the required votes are reached the transaction is executed.
- `function get_confirmations(tx_id : int)` - gets the votes gathered in regards with transaction execution proposal.