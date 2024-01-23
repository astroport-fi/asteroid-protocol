# CFT-20 Token Standard

## Introduction

The CFT-20 token standard describes how we create, mint and transfer fungible tokens using the Meteors metaprotocol framework. It is derived from the initial BRC-20 idea from [@redphonecrypto](https://twitter.com/redphonecrypto/status/1632481591069929478) and implementation from [@domo](https://twitter.com/domodata/status/1633658976931037184). However, it differs in implementation, and takes a more [CBRC-20](https://cybord.org/) approach.

## Technical details

The CFT-20 standard is implemented using the [Meteors metaprocotol framework](../meteors-metaprotocols.md). It relies only on the URN in the memo field with the exception of an optional logo that may be specified when creating a token that uses [Meteors inscriptions](../cosmos-inscriptions.md)

### URNs

**Creating a new token**

`urn:cft20:{chain-id}@{version};{operation}${param}={value},{param}={value}`

The operation values are:

|Key|Value|Description|
|---|-----|-----------|
|chain-id|cosmoshub-4|The chain ID for the Cosmos Hub|
|version|v1|The current version|
|operation|deploy|Deploy a new token|

The required parameters are:

|Param|Description|Restrictions|
|-----|-----------|------------|
|nam|The name of the token|Must be 3-32 characters|
|tic|The token ticker, must be unique across all tokens on the same chain-id|Must be 1-10 alphanumeric characters|
|sup|The max supply of the token|Must be less than uint32 max|
|dec|The decimals for the token|Must be between 0 and 6 (inclusive)|
|lim|The maximum tokens that can be minted per transaction|Must be 1% or less than maximum supply|
|opn|The Unix timestamp which after minting becomes possible|Must be a Unix timestamp in seconds|


**Minting a token**

`urn:cft20:{chain-id}@{version};{operation}${param}={value},{param}={value}`

The operation values are:

|Key|Value|Description|
|---|-----|-----------|
|chain-id|cosmoshub-4|The chain ID for the Cosmos Hub|
|version|v1|The current version|
|operation|mint|Mint the specified amount to the sender's wallet|

The required parameters are:

|Param|Description|Restrictions|
|-----|-----------|------------|
|tic|The token ticker, must be unique across all tokens on the same chain-id|Must be 1-10 alphanumeric characters|
|amt|The amount to mint|Must be less than or equal to the token's lim parameter|


**Transferring a token**

`urn:cft20:{chain-id}@{version};{operation}${param}={value},{param}={value}`

The operation values are:

|Key|Value|Description|
|---|-----|-----------|
|chain-id|cosmoshub-4|The chain ID for the Cosmos Hub|
|version|v1|The current version|
|operation|transfer|Transfer the specified amount to the destination address|

The required parameters are:

|Param|Description|Restrictions|
|-----|-----------|------------|
|tic|The token ticker, must be unique across all tokens on the same chain-id|Must be 3-5 characters|
|amt|The amount to transfer|Must be less or equal to the sender's balance|
|dst|The address to transfer to|Any address on the chain-id, the address is _not_ validated|

**The first CFT-20 token**

All indexers should register Asteroids (ROIDS) as the first CFT-20 token (Token #0). Other CFT-20 tokens are numbered in order, starting at #1, in the order in which they are inscribed.


**Trading tokens**

Trading is not yet possible, we're working on it
