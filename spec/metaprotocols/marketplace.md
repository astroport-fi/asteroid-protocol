# The Marketplace metaprotocol

## Introduction

While the CFT-20 standard added support to list, buy and delist tokens for sale, it is flawed in that it can cause double-spending from the buyers side.
This metaprotocol aims to solve that to a large extent as well as enable trading of any metaprotocol item. 

## Technical details

The Marketplace standard is implemented using the [Meteors metaprocotol framework](../meteors-metaprotocols.md). It only relies only on the URN in the memo field that indicated what is being listed, reserved or bought.

## Restrictions on when specific actions are considered valid

The metaprotocol only allows transactions to be settled in ATOM

**Create a listing**

The seller must own the item or tokens they are selling

**Cancelling a listing**

1. The listing must be open
1. The listing must not be reserved, filled or cancelled
1. The listing must be owned by the sender

**Reserving a listing to buy**

1. The listing must be open
1. The listing must not be reserved, filled or cancelled
1. The sender must send the minimum deposit for the listing

**Buying a reserved listing**

1. The listing must be reserved by the sender
1. The sender must send the balance of the transaction, that is sale amount minus deposit
1. If the listing has passed the timeout but hasn't been cancelled or reserved by another buyer, then the sale may proceed


### URNs

**Creating a new listing for CFT-20 tokens**

`urn:marketplace:{chain-id}@{version};{operation}${param}={value},{param}={value}`

The operation values are:

|Key|Value|Description|
|---|-----|-----------|
|chain-id|cosmoshub-4|The chain ID for the Cosmos Hub|
|version|v1|The current version|
|operation|list.cft20|List a CFT-20 for sale|

The required parameters are:

|Param|Description|Restrictions|
|-----|-----------|------------|
|tic|The token ticker, must be unique across all tokens on the same chain-id|Must be 1-10 characters|
|amt|The amount being sold|Must be less then the sellers holdings|
|ppt|The price per token in uatom|Must be less than uint32 max|
|mindep|The minimum deposit expressed as a percentage of total|Must be between 0.1% and 1%|
|to|The block this reservation expires|Must be between 50 and 500 (roughly 5-50 minutes)|

The tokens must be owned by the sender and be >= balance

**Creating a new listing for Content inscriptions**

`urn:marketplace:{chain-id}@{version};{operation}${param}={value},{param}={value}`

The operation values are:

|Key|Value|Description|
|---|-----|-----------|
|chain-id|cosmoshub-4|The chain ID for the Cosmos Hub|
|version|v1|The current version|
|operation|list.inscription|List an inscription for sale|

The required parameters are:

|Param|Description|Restrictions|
|-----|-----------|------------|
|h|The hash of the inscription's original transaction|Must be a valid hash|
|total|The amount of uatom to buy this listing|Must be less than uint32 max|
|mindep|The minimum deposit expressed as a percentage of total|Must be between 0.1% and 1%|
|to|Amount of blocks a reservation is valid for|Must be between 50 and 500 (roughly 5-50 minutes)|

The inscription must be owned by the sender

**Reserve any listing for purchase**

`urn:marketplace:{chain-id}@{version};{operation}${param}={value},{param}={value}`

The operation values are:

|Key|Value|Description|
|---|-----|-----------|
|chain-id|cosmoshub-4|The chain ID for the Cosmos Hub|
|version|v1|The current version|
|operation|deposit|Make a deposit to reserve a listing|

The required parameters are:

|Param|Description|Restrictions|
|-----|-----------|------------|
|h|The hash of the listing|Must be a valid hash|

1. The listing must be open, not cancelled or reserved
1. The sender must also send the minimum deposit amount of uatom


**Removing a listing**

Cancelling a listing that has been reserved is not possible

`urn:marketplace:{chain-id}@{version};{operation}${param}={value},{param}={value}`

The operation values are:

|Key|Value|Description|
|---|-----|-----------|
|chain-id|cosmoshub-4|The chain ID for the Cosmos Hub|
|version|v1|The current version|
|operation|delist|Cancel a listing|

The required parameters are:

|Param|Description|Restrictions|
|-----|-----------|------------|
|h|The hash of the listing|Must be a valid hash|

The listing must be owned by the sender


**Cancel a reservation**

Cancelling a reservation is currently not possible. The timeout must expire


**Buying a listing**

`urn:marketplace:{chain-id}@{version};{operation}${param}={value},{param}={value}`

The operation values are:

|Key|Value|Description|
|---|-----|-----------|
|chain-id|cosmoshub-4|The chain ID for the Cosmos Hub|
|version|v1|The current version|
|operation|buy|Buy a reserved listing|

The required parameters are:

|Param|Description|Restrictions|
|-----|-----------|------------|
|h|The hash of the listing|Must be a valid hash|

1. The listing must be reserved by the sender.
1. The sender must send the balance of the total ask for the listing, that is total - deposit

## Processing of marketplace transactions

Marketplace transactions carry minimal fees to deter spamming of listings and reduce double-deposits. 
These fees must be enforced by the indexer when implementing this metaprotocol in order for the mitigations to remain effective against bots.
The fees are sent to the Astroport Maker contract on Neutron via IBC in ATOM.

The address of the contract is neutron1unc0549k2f0d7mjjyfm94fuz2x53wrx3px0pr55va27grdgmspcqgzfr8p
and the IBC channel to verify is channel-569
