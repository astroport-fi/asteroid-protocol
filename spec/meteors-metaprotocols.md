# Meteors - The Cosmos Metaprotocols Framework

## Introduction

Meteors provide a framework for building other protocols on top of a Cosmos SDK blockchain. These protocols inscribe their content in a structured format to be indexed and used off-chain. This is particularly useful on the Cosmos Hub as the Hub does not have smart contract capabilities.

This document describes how metaprotocols work in terms of our implementation, how you can build your own and the ones we've built already.

## Technical details

### The format

The current implementation uses a URN (Uniform resource locator) in the transaction memo field with any other content required for the metaprotocol inscribed as specified in the [Cosmos inscription specification](cosmos-inscriptions.md).

Thus, the most basic metaprotocol transaction layout is:

```json
{
    "body": {
        "messages": [
            {
                "@type": "/cosmos.bank.v1beta1.MsgSend",
                "from_address": "sender-address",
                "to_address": "fee-receiver-address",
                "amount": [
                    {
                        "denom": "uatom",
                        "amount": "1"
                    }
                ]
            }
        ],
        "memo": "urn-for-metaprotocol",
        "timeout_height": "0",
        "extension_options": [],
        "non_critical_extension_options": []
    },
    "auth_info": {
        "signer_infos": [],
        "fee": {
            "amount": [],
            "gas_limit": "7000000",
            "payer": "",
            "granter": ""
        }
    },
    "signatures": []
}
```

### The URN (Uniform resource locator)

The memo field holds the URN for the metaprotocol and allows the identification of the protocol as well as the operation being applied. Metaprotocols may or may not use and rely on other fields in the transaction. The Meteors framework place no restriction on a metaprotocol other than 

1. a BankMsg::Send message must be part of the transaction and 
2. a valid URN (see RFC..TODO) must be specified in the memo field

The URN structure is typically:

`urn:{metaprotocol}:{chain-id}@{version};{op}${param1}={value1},{param2}={value2},{paramN}={valueN}`

An example URN for deploying a new CFT-20 token is

`urn:cft20:cosmoshub-4@v1;deploy$nam=Token 1,tic=TOKN1,sup=1000000`

This URN shows that this is a CFT-20 token on the Cosmos Hub using v1 of the CFT-20 specification. The operation is to deploy a new token that has a name "Token 1", a ticker "TOKN1" and a max supply of 1 000 000.

### Regarding fees

We implement a minimal fee for metaprotocol usage. This fee is included as a BankMsg::Send transaction and is intended to fund the infrastructure and development of the Meteors framework and other metaprotocol standards. We do this from the start in an attempt to make Meteors self-sustained from the start instead of asking for funding from the Hub at a later date.

Further, we acknowledge that inscribing arbitrary content onto the Hub increases storage and cost for validators and node operators. To counter this, we increase the chain's transaction fee substantially and hope this increase would keep validating the Hub sustainable in the long run. 

### Implemented metaprotocols

1. [Arbitrary content inscriptions](./metaprotocols/inscriptions.md)
2. [CFT-20 Tokens](./metaprotocols/cft20.md)


## What can you build with Meteor metaprotocols?

Anything you can imagine, really.

Because our method allows up to 800kb of arbitrary data to be inscribed and we place no limitations on what that data may be you can build a very wide variety of protocols. Some ideas could be a social network, blogging platform, forums, encrypted chat and a lot more. 
