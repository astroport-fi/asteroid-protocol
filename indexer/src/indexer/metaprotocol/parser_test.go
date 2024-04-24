package metaprotocol

import (
	"testing"

	"github.com/leodido/go-urn"
	"github.com/stretchr/testify/assert"
)

func TestParseProtocolString(t *testing.T) {
	protocolURN, ok := urn.Parse([]byte("urn:inscription:cosmoshub-4@v1beta;inscribe$h=c4749f95902411d1a45a033d8a6b3e6aa0de0a0028fe8737f66fed6834dce8bf"))

	assert.True(t, ok, "ok should be true")
	assert.NotNil(t, protocolURN, "protocolURN should not be nil")

	expectedProtocolURN := ProtocolURN{
		ChainID:   "cosmoshub-4",
		Version:   "v1beta",
		Operation: "inscribe",
		KeyValuePairs: map[string]string{
			"h": "c4749f95902411d1a45a033d8a6b3e6aa0de0a0028fe8737f66fed6834dce8bf",
		},
	}

	parsedProtocolURN, err := ParseProtocolString(protocolURN)

	assert.NoError(t, err, "error should be nil")
	assert.Equal(t, expectedProtocolURN, parsedProtocolURN, "parsedProtocolURN should match expectedProtocolURN")
}

func TestParseProtocolStringWithMultiArgs(t *testing.T) {
	protocolURN, ok := urn.Parse([]byte("urn:inscription:cosmoshub-4@v1beta;inscribe$h=c4749f95902411d1a45a033d8a6b3e6aa0de0a0028fe8737f66fed6834dce8bf,exp=123"))

	assert.True(t, ok, "ok should be true")
	assert.NotNil(t, protocolURN, "protocolURN should not be nil")

	expectedProtocolURN := ProtocolURN{
		ChainID:   "cosmoshub-4",
		Version:   "v1beta",
		Operation: "inscribe",
		KeyValuePairs: map[string]string{
			"h":   "c4749f95902411d1a45a033d8a6b3e6aa0de0a0028fe8737f66fed6834dce8bf",
			"exp": "123",
		},
	}

	parsedProtocolURN, err := ParseProtocolString(protocolURN)

	assert.NoError(t, err, "error should be nil")
	assert.Equal(t, expectedProtocolURN, parsedProtocolURN, "parsedProtocolURN should match expectedProtocolURN")
}

func TestParseProtocolStringWithListArg(t *testing.T) {
	protocolURN, ok := urn.Parse([]byte("urn:inscription:cosmoshub-4@v1beta;inscribe$h=a,b,c,d,exp=123"))

	assert.True(t, ok, "ok should be true")
	assert.NotNil(t, protocolURN, "protocolURN should not be nil")

	expectedProtocolURN := ProtocolURN{
		ChainID:   "cosmoshub-4",
		Version:   "v1beta",
		Operation: "inscribe",
		KeyValuePairs: map[string]string{
			"h":   "a,b,c,d",
			"exp": "123",
		},
	}

	parsedProtocolURN, err := ParseProtocolString(protocolURN)

	assert.NoError(t, err, "error should be nil")
	assert.Equal(t, expectedProtocolURN, parsedProtocolURN, "parsedProtocolURN should match expectedProtocolURN")
}

func TestParseProtocolStringNoArgs(t *testing.T) {
	protocolURN, ok := urn.Parse([]byte("urn:inscription:cosmoshub-4@v1beta;inscribe$"))

	assert.True(t, ok, "ok should be true")
	assert.NotNil(t, protocolURN, "protocolURN should not be nil")

	expectedProtocolURN := ProtocolURN{
		ChainID:       "cosmoshub-4",
		Version:       "v1beta",
		Operation:     "inscribe",
		KeyValuePairs: nil,
	}

	parsedProtocolURN, err := ParseProtocolString(protocolURN)

	assert.NoError(t, err, "error should be nil")
	assert.Equal(t, expectedProtocolURN, parsedProtocolURN, "parsedProtocolURN should match expectedProtocolURN")
}
