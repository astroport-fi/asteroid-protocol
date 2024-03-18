package metaprotocol

import (
	"fmt"
	"strconv"

	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/types"
)

type TokensTransferKind int

const (
	Send TokensTransferKind = iota
	IbcTransfer
)

// GetBaseTokensSent returns the amount of base tokens sent in a transaction
func GetBaseTokensSent(rawTransaction types.RawTransaction, receiver string, kind TokensTransferKind, ibcEnabled bool) (uint64, error) {
	if ibcEnabled && kind == IbcTransfer {
		return GetBaseTokensSentIBC(rawTransaction, receiver)
	}

	var err error
	var amountSent uint64
	validReceiver := false

	for _, v := range rawTransaction.Body.Messages {
		if v.Type == "/cosmos.bank.v1beta1.MsgSend" {
			if v.ToAddress == receiver {
				validReceiver = true
			} else {
				continue
			}

			if v.Amount[0].Denom != "uatom" {
				return 0, fmt.Errorf("incorrect denom sent, got %s, expected uatom", v.Amount[0].Denom)
			}

			amountSent, err = strconv.ParseUint(v.Amount[0].Amount, 10, 64)
			if err != nil {
				return 0, err
			}
			break
		}
	}

	if !validReceiver {
		return 0, fmt.Errorf("invalid receiver, expected %s", receiver)

	}

	return amountSent, nil
}

// GetBaseTokensSentIBC returns the amount of base tokens sent in a transaction
// to be IBC'd
func GetBaseTokensSentIBC(rawTransaction types.RawTransaction, receiver string) (uint64, error) {
	var err error
	var amountSent uint64
	for _, v := range rawTransaction.Body.Messages {
		if v.Type == "/ibc.applications.transfer.v1.MsgTransfer" {
			if v.Token.Denom != "uatom" {
				return 0, fmt.Errorf("incorrect denom sent, got %s, expected uatom", v.Amount[0].Denom)
			}
			if v.SourceChannel != "channel-569" {
				return 0, fmt.Errorf("incorrect IBC channel, got %s, expected channel-569", v.SourceChannel)
			}
			if v.Receiver != receiver {
				return 0, fmt.Errorf("incorrect IBC receiver, got %s, expected %s", v.Receiver, receiver)
			}

			amountSent, err = strconv.ParseUint(v.Token.Amount, 10, 64)
			if err != nil {
				return 0, err
			}
			return amountSent, nil
		}
	}
	return 0, fmt.Errorf("invalid fee attached to transaction")
}
