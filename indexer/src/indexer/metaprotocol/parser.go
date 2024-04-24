package metaprotocol

import (
	"fmt"
	"strings"

	"github.com/leodido/go-urn"
)

type ProtocolURN struct {
	ChainID       string
	Version       string
	Operation     string
	KeyValuePairs map[string]string
}

func ParseProtocolString(protocolURN *urn.URN) (ProtocolURN, error) {
	var parsedProtocolURN ProtocolURN
	// We need to parse the protocol specific string in SS, it contains
	// {chainId}@{version};operation$h={unique hash of content}
	// cosmoshub-4@v1beta;inscribe$h=c4749f95902411d1a45a033d8a6b3e6aa0de0a0028fe8737f66fed6834dce8bf
	sourceContent := strings.Split(protocolURN.SS, ";")
	if len(sourceContent) != 2 {
		return parsedProtocolURN, fmt.Errorf("invalid source/content split: %s", protocolURN.SS)
	}

	// Parse cosmoshub-4@v1beta
	sourceVersioning := strings.Split(sourceContent[0], "@")
	if len(sourceVersioning) != 2 {
		return parsedProtocolURN, fmt.Errorf("incorrect source versioning parts: %s", protocolURN.SS)
	}
	parsedProtocolURN.ChainID = sourceVersioning[0]
	parsedProtocolURN.Version = sourceVersioning[1]

	// Parse inscribe$h=...contenthash...
	opContent := strings.Split(sourceContent[1], "$")
	if len(opContent) != 2 {
		return parsedProtocolURN, fmt.Errorf("invalid op/content parts: %s", protocolURN.SS)
	}
	parsedProtocolURN.Operation = opContent[0]

	if opContent[1] == "" {
		return parsedProtocolURN, nil
	}

	// Parse h=...contenthash...
	// Parse key=value,key=value
	keyValuePairs := make(map[string]string)
	keyValuePairsString := strings.Split(opContent[1], ",")
	prevKey := ""

	for _, keyValuePair := range keyValuePairsString {
		keyValue := strings.Split(keyValuePair, "=")
		if len(keyValue) != 2 {
			if len(keyValue) == 1 && prevKey != "" {
				keyValuePairs[prevKey] = strings.Join([]string{keyValuePairs[prevKey], keyValue[0]}, ",")
				continue
			}

			return parsedProtocolURN, fmt.Errorf("invalid key/value pair: %s", protocolURN.SS)
		}
		keyValuePairs[keyValue[0]] = keyValue[1]
		prevKey = keyValue[0]
	}
	parsedProtocolURN.KeyValuePairs = keyValuePairs

	return parsedProtocolURN, nil
}
