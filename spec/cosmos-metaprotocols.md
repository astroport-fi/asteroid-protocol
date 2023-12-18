# Cosmos Metaprotocols Implementation

## Introduction

This document describes how we use the [Cosmos inscription specification](cosmos-inscriptions.md) to implement various features, from NFT's to [BRC-20](https://layer1.gitbook.io/layer1-foundation/protocols/brc-20/documentation) style tokens.

What we aim to support in the MVP:

1. BRC-20 style tokens (creating, trading and transfers)
2. Arbitrary data such as images, websites, audio files, etc.

What we'd like to support in the near future:

1. NFTs (minting, trading and transfers)
2. Multipart inscriptions (inscriptions spanning multiple transactions)
3. ?

## Technical

As a reminder the structure we work with is as follows:

```json
{
    "@type": "/cosmos.authz.v1beta1.MsgRevoke",
    "granter": "{\"name\": \"My inscribed image\"}",
    "grantee": "IHNobGRrIGxoc..gbDtkaGE=",
    "msg_type_url": "image/png"
}
```

This can be translated to:

```json
{
    "@type": "/cosmos.authz.v1beta1.MsgRevoke",
    "granter": "JSON Metadata in base64",
    "grantee": "Content in base64",
    "msg_type_url": "Protocol information"
}
```


### Inscription Types

Restricting the use of `msg_type_url` to standard MIME content types seems very limiting, instead we'll implement a higher level type which identifies the metaprotocol. The metadata and content is then dictated by the specific metaprotocol specification.

### Metaprotocols

Write something about this somewhere

```json
<metaprotocol>:[op]:[tick]=[amt] 
```

We following the following standard

urn:metaprotocol:chain/protocol-specific-string

example

urn:inscription:cosmoshub/content/unique-id-of-the-content
urn:nft:cosmoshub/nft/creator_address/unique-id-of-the-nft
urn:nft:cosmoshub/nft-collection/creator_address/unique-id-of-the-nft-collection

Actions are extended by the ? question mark
urn:cft20:cosmoshub/mint?TOKEN=1000
urn:cft20:cosmoshub/transfer?TOKEN=1000&destination=destination-address


Initially we implement the following metaprotocols:

**Generic content inscriptions**

Generic content inscriptions can be summarised as the ability to inscribe any data under 800kb on the chain. It simply holds data of a certain type.

Metaprotocol identifier

```json
urn:inscription:{chain}/content/{unique id}
```

Once the inscription is identified, the indexer will process the rest of the inscription based on the rules and workings of the metaprotocol


**CFT-20 Tokens**

Our implementation differs from the BRC-20-like protocols on other chains?

urn:cft20:{chain}/{op}/{tick}={amount}


We'll implement the following types:

**`inscriptions.v1.content.generic`**

A generic type that has very little metadata with any content a user desires

TODO: Example

**`inscriptions.v1.content.nft`**

A standard NFT with metadata based on [OpenSea's metadata standards](https://docs.opensea.io/docs/metadata-standards)

TODO: Example

**`inscriptions.v1.content.nft.collection`**

A standard NFT collection based on [OpenSea's collection model](https://docs.opensea.io/v1.0/reference/collection-model)

TODO: Example


### Multipart inscriptions

Multipart inscriptions allow you to inscribe larger content across several transactions. All transactions referenced in a multipart inscription must be valid for the entire inscription to be considered valid.

**`inscriptions.v1.multipart`**

The multipart type indicates this inscription is part of a multipart inscription and the linking inscription will come in a later transaction. In this inscription the `grantee` field is the partial base64 of the final inscription. 

The metadata specific in `granter` follows the following minimalistic structure:

```json
{
    "part": {
        "index": 0,
        "total": 5
    }
}
```

Linking partial inscriptions together is a matter of indicating the individual parts within the final metadata.

```json
{
    "parent": {
        ..parent information, NOT partial inscriptions..
    },
    "multipart": {
        "parts": [
            ..ordered list of transaction hashes..
        ]
    },
    "metadata": {
        ..as defined by the content type..
    }
}
```

Having the linking inscription follow the same structure as all other inscriptions allows the multipart inscription to be of any of the supported types without addditional work needed.

TODO: Example


### Actions

Apart from normal content inscriptions we also define actions that can be taken, governed by rules. These actions cover things like ownership and transfers and is needed as the inscriptions aren't processed by the chain as normal token transfers would be, as example.

Thus the need for an indexer that follows these rules. The indexer essentially determines the state and ownership of content inscriptions.

We'll implement the following actions:

**`inscriptions.v1.action.transfer`**

Transfer the ownership of an inscription to another wallet. This can only be initiated by the current owner of an inscription

**`inscriptions.v1.action.burn`**

Burn an inscription, essentially removing it. This may only be done by the current owner. See "Root inscriptions" for other use cases.


### Root inscriptions

**`inscriptions.v1.root`**

Represents a parent inscription to inscriptions that will follow it. It may be a creator's avatar, or the start of a collection or an alter ego. A wallet may create multiple root inscriptions, but only the creator of the root inscription may link new inscriptions to that root.

This provides a way to build a hierarchy or lineage from parent to child. A creator may inscribe a root avatar containing their PFP and link all inscriptions to that root. When creating collections all inscriptions in the collection can be linked to the root and once the collection is complete, the root may be burned, preventing any new inscriptions to be added.

See this great post on [Ordinals: DNA for Inscriptions](https://medium.com/@cypherpork/ordinals-inscriptions-and-genetics-9f264377e00a) for more detailed description.


### Base structure for metadata

```json
{
    "parent": {
        "@type": "/cosmos.bank.Account",
        "identifier": "cosmos address"
    },
    "metadata": {
        ..as defined by the content type..
    }
}
```

or with a parent inscription

```json
{
    "parent": {
        "@type": "inscriptions.v1.root",
        "identifier": "inscription transaction hash"
    },
    "metadata": {
        ..as defined by the content type..
    }
}
```
