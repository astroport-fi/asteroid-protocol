# Cosmos Inscriptions Specification

## Introduction

This document details a way to inscribe arbitrary data onto a Cosmos SDK blockchain. Inscribing data onto the chain ensures it will live on for as long as the chain is running.

## Background

[Inscriptions on Bitcoin](https://docs.ordinals.com/guides/inscriptions.html) (and now, other chains as well) have recently become possible. We explored methods to do the same on Cosmos SDK chains and found a method that would allow ~800kb to be inscribed on most chains in a single transaction - depending on a chain's parameters, it might be more or less.

The original [Ordinal Theory on Bitcoin](https://docs.ordinals.com/) is a great read if this interests you.


## Technical

### Overview

The Cosmos SDK differs in a big way from other blockchain implementations in that messages are validated and rarely do you find any part of a transaction that isn't strictly controlled by some definition. This is generally good and avoids a lot of mistakes, however, it also makes it harder to put arbitrary data in a transaction.

One of the fields that are somewhat suited for inscriptions is the 'memo' field. The memo field is used in transfers to [centralised exchanges](https://support.ledger.com/hc/en-us/articles/360013713840-Cosmos-ATOM-?docs=true) as well as [IBC-Hooks](https://github.com/cosmos/ibc-apps/blob/main/modules/ibc-hooks/README.md). The memo field is very limiting though, the Cosmos Hub has a maximum length of 512 characters. There was an attempt on the [Cosmos Hub forum to increase it](https://forum.cosmos.network/t/last-call-increase-the-size-of-the-memo-field-to-100kb-and-10x-the-cost-of-bytes/11500), but it doesn't seem a proposal was put to a vote on this.

There is another section of a transaction that allows arbitrary data to be added as long as you conform to the message type built into the chain.
This section is `non_critical_extension_options`.

### non_critical_extension_options

From the [SDK documentation](https://docs.cosmos.network/v0.45/core/proto-docs.html)

> extension_options are arbitrary options that can be added by chains when the default options are not sufficient. If any of these are present and can't be handled, they will be ignored

The final part of the sentence is key "if any of these are present and can't be handled, they will be ignored". This leaves a path for adding content that is not validated past the protocol buffer type. As long as you use a type known to the chain, it can be used. An example is the sending of tokens below using the `/cosmos.bank.v1beta1.MsgSend` type:

```json
{
    "@type": "/cosmos.bank.v1beta1.MsgSend",
    "from_address": "cosmos1fkwcez7yzjz2gpzhesdsd3r5wp0w82cftr4k95",
    "to_address": "cosmos198tjtk9rzwzwcce6r8uu2gj950p9gqakm6jz92",
    "amount": [
        {
            "denom": "uatom",
            "amount": "1"
        }
    ]
}
```

In this example, the field names are validated, but the _content_ of the fields are not. This is expected as this specific option isn't handled and thus ignored - none of the ones we tried is handled. One of the caveats of this approach is that [SIGN_MODE_DIRECT](https://docs.cosmos.network/main/learn/advanced/transactions#sign_mode_direct-preferred) is required which means this [will not work with Ledger devices](https://docs.cosmos.network/main/build/architecture/adr-050-sign-mode-textual#context)

`MsgSend` is not really well suited for what we want to achieve, we feel that `/cosmos.authz.v1beta1.MsgRevoke` is better suited. It has the following structure

```json
{
    "@type": "/cosmos.authz.v1beta1.MsgRevoke",
    "granter": "cosmos1fkwcez7yzjz2gpzhesdsd3r5wp0w82cftr4k95",
    "grantee": "cosmos198tjtk9rzwzwcce6r8uu2gj950p9gqakm6jz92",
    "msg_type_url": "/cosmos.bank.v1beta1.MsgSend"
}
```

With a bit of creativity, we can:

1. Identity the type of content stored in this transaction
2. Provide metadata for the content stored
3. Store arbitrary data in base64

That gives us:

```json
{
    "@type": "/cosmos.authz.v1beta1.MsgRevoke",
    "granter": "{\"name\": \"My inscribed image\"}",
    "grantee": "IHNobGRrIGxoc..gbDtkaGE=",
    "msg_type_url": "image/png"
}
```

The fields represent:

|Field|Description|
|-----|-----------|
|`@type`|The protobuf type that the chain recognises, but doesn't validate|
|`msg_type_url`|Can be anything|
|`granter`|base64 encoded metadata about the content|
|`grantee`|The actual base64 encoded content. All content is to be base64 encoded|

We use the `MsgRevoke` here as is is a no-op and is ignored by the chain when part of `non_critical_extension_options`. In any case, the content is invalid and the chain would reject the message if it was ever implemented as part of `non_critical_extension_options`.

## Summary

This document provided a method of how inscriptions can be done with a much larger limit than the memo field, albeit in an unconventional fashion. Next we'll look at how we implemented this to be extensible and enable a vast variety of use-cases by introducing [Meteor metaprotocols](./meteors-metaprotocols.md).