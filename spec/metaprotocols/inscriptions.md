# Arbitrary content inscription standard

## Introduction

This inscription standard describes how we create and tranfer inscriptions of arbitrary data using the Meteors metaprotocol framework 


## Technical details

This standard is implemented using the [Meteors metaprocotol framework](../meteors-metaprotocols.md). It relies on the URN in the memo field the actual data being inscribed using the [Meteors inscriptions](../cosmos-inscriptions.md) technique.

### URNs

**Creating a new inscription**

`urn:inscription:{chain-id}@{version};{operation}${param}={value},{param}={value}`

The operation values are:

|Key|Value|Description|
|---|-----|-----------|
|chain-id|cosmoshub-4|The chain ID for the Cosmos Hub|
|version|v1|The current version|
|operation|inscribe|Inscribe new content|

The required parameters are:

|Param|Description|Restrictions|
|-----|-----------|------------|
|h|The hash of the content being inscribed|Must be SHA-256(base64(JSON metadata) + base64(content))|

**Transferring an inscription**

`urn:cft20:{chain-id}@{version};{operation}${param}={value},{param}={value}`

The operation values are:

|Key|Value|Description|
|---|-----|-----------|
|chain-id|cosmoshub-4|The chain ID for the Cosmos Hub|
|version|v1|The current version|
|operation|transfer|Transfer the inscription to a new owner|

The required parameters are:

|Param|Description|Restrictions|
|-----|-----------|------------|
|h|The transaction hash containing the inscription|Must be a valid transaction and the sender must be the current owner|
|dst|The address to transfer to|Any address on the chain-id, the address is _not_ validated|

**Trading inscriptions**

Trading is not yet possible, we're working on it
