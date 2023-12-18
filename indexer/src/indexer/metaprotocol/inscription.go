package metaprotocol

import (
	"fmt"
	"strings"
)

type Inscription struct {
}

func NewInscriptionProcessor() *Inscription {
	return &Inscription{}
}

func (i *Inscription) Name() string {
	return "Inscription"
}

func (i *Inscription) Process(protocolData string, metadata []byte, data []byte) error {
	// protocolData for an inscription looks like the following
	// {chainId}=content@{unique hash of content}

	chainParts := strings.Split(protocolData, "=")
	if len(chainParts) != 2 {
		return fmt.Errorf("invalid protocol data: %s", protocolData)
	}

	chainID := chainParts[0]
	contentParts := strings.Split(chainParts[1], "@")
	if len(contentParts) != 2 {
		return fmt.Errorf("invalid protocol data: %s", protocolData)
	}

	if contentParts[0] != "content" {
		return fmt.Errorf("invalid protocol data: %s", protocolData)
	}
	contentHash := contentParts[1]

	fmt.Println("Got chainID: ", chainID)
	fmt.Println("Got hash: ", contentHash)
	fmt.Println("Got metadata: ", metadata)
	fmt.Println("Got data: ", data)

	return nil
}
