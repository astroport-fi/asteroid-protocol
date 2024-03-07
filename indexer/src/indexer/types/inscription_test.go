package types

import (
	"encoding/json"
	"os"
	"testing"

	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/decoder"
	"google.golang.org/protobuf/proto"
)

func TestInscription(t *testing.T) {
	inscription := Inscription{
		ParentType:       "parent_type",
		ParentIdentifier: "parent_identifier",
		Metadata:         []byte("metadata"),
		Content:          []byte("content"),
	}

	out, err := proto.Marshal(&inscription)
	if err != nil {
		t.Errorf("error marshalling: %v", err)
	}

	deserializedInscription := &Inscription{}
	if err := proto.Unmarshal(out, deserializedInscription); err != nil {
		t.Errorf("error unmarshalling: %v", err)
	}

	if deserializedInscription.ParentType != "parent_type" {
		t.Errorf("expected parent_type, got %v", deserializedInscription.ParentType)
	}
	if deserializedInscription.ParentIdentifier != "parent_identifier" {
		t.Errorf("expected parent_identifier, got %v", deserializedInscription.ParentIdentifier)
	}
	if string(deserializedInscription.Metadata) != "metadata" {
		t.Errorf("expected metadata, got %v", string(deserializedInscription.Metadata))
	}
	if string(deserializedInscription.Content) != "content" {
		t.Errorf("expected content, got %v", string(deserializedInscription.Content))
	}
}

func TestExtensionData(t *testing.T) {
	extensionData := decoder.ExtensionData{
		ProtocolId:      "protocol_id",
		ProtocolVersion: "protocol_version",
		Data:            []byte("data"),
	}
	out, err := extensionData.Marshal()
	if err != nil {
		t.Errorf("error marshalling: %v", err)
	}

	deserializedExtensionData := &decoder.ExtensionData{}
	if err := deserializedExtensionData.Unmarshal(out); err != nil {
		t.Errorf("error unmarshalling: %v", err)
	}

	if deserializedExtensionData.ProtocolId != "protocol_id" {
		t.Errorf("expected protocol_id, got %v", deserializedExtensionData.ProtocolId)
	}

	if deserializedExtensionData.ProtocolVersion != "protocol_version" {
		t.Errorf("expected protocol_version, got %v", deserializedExtensionData.ProtocolVersion)
	}

	if string(deserializedExtensionData.Data) != "data" {
		t.Errorf("expected data, got %v", string(deserializedExtensionData.Data))
	}
}

func TestExtensionWithInscription(t *testing.T) {
	inscription := Inscription{
		ParentType:       "parent_type",
		ParentIdentifier: "parent_identifier",
		Metadata:         []byte("metadata"),
		Content:          []byte("content"),
	}

	inscriptionBytes, err := proto.Marshal(&inscription)
	if err != nil {
		t.Errorf("error marshalling: %v", err)
	}

	extensionData := decoder.ExtensionData{
		ProtocolId:      "protocol_id",
		ProtocolVersion: "protocol_version",
		Data:            inscriptionBytes,
	}
	extensionBytes, err := extensionData.Marshal()
	if err != nil {
		t.Errorf("error marshalling: %v", err)
	}

	deserializedExtensionData := &decoder.ExtensionData{}
	if err := deserializedExtensionData.Unmarshal(extensionBytes); err != nil {
		t.Errorf("error unmarshalling: %v", err)
	}

	deserializedInscription := &Inscription{}
	if err := proto.Unmarshal(deserializedExtensionData.Data, deserializedInscription); err != nil {
		t.Errorf("error unmarshalling: %v", err)
	}

	if deserializedInscription.ParentType != "parent_type" {
		t.Errorf("expected parent_type, got %v", deserializedInscription.ParentType)
	}
	if deserializedInscription.ParentIdentifier != "parent_identifier" {
		t.Errorf("expected parent_identifier, got %v", deserializedInscription.ParentIdentifier)
	}
	if string(deserializedInscription.Metadata) != "metadata" {
		t.Errorf("expected metadata, got %v", string(deserializedInscription.Metadata))
	}
	if string(deserializedInscription.Content) != "content" {
		t.Errorf("expected content, got %v", string(deserializedInscription.Content))
	}
}

func TestOldTx(t *testing.T) {
	readFile, err := os.ReadFile("testdata/tx-msg-revoke.txt")
	if err != nil {
		t.Fatalf("error reading file: %v", err)
	}

	decoder := decoder.DefaultDecoder
	decodedTx, err := decoder.DecodeBase64(string(readFile))
	if err != nil {
		t.Fatalf("error reading file: %v", err)
	}

	jsonTx, err := decodedTx.MarshalToJSON()
	if err != nil {
		t.Fatalf("error marshalling to json: %v", err)
	}

	var rawTransaction RawTransaction
	err = json.Unmarshal(jsonTx, &rawTransaction)
	if err != nil {
		t.Fatalf("error unmarshalling: %v", err)
	}

	msg, err := rawTransaction.Body.NonCriticalExtensionOptions[0].UnmarshalData()
	if err != nil {
		t.Fatalf("error unmarshalling: %v", err)
	}

	metadata, err := msg.GetMetadata()
	if err != nil {
		t.Fatalf("error getting metadata: %v", err)
	}

	if metadata.Metadata.Name != "ABC" {
		t.Fatalf("expected ABC, got %v", metadata.Metadata.Name)
	}
}

func TestNewTx(t *testing.T) {
	readFile, err := os.ReadFile("testdata/tx-extension-data.txt")
	if err != nil {
		t.Fatalf("error reading file: %v", err)
	}

	decoder := decoder.DefaultDecoder
	decodedTx, err := decoder.DecodeBase64(string(readFile))
	if err != nil {
		t.Fatalf("error reading file: %v", err)
	}

	jsonTx, err := decodedTx.MarshalToJSON()
	if err != nil {
		t.Fatalf("error marshalling to json: %v", err)
	}

	var rawTransaction RawTransaction
	err = json.Unmarshal(jsonTx, &rawTransaction)
	if err != nil {
		t.Fatalf("error unmarshalling: %v", err)
	}

	msg, err := rawTransaction.Body.NonCriticalExtensionOptions[0].UnmarshalData()
	if err != nil {
		t.Fatalf("error unmarshalling: %v", err)
	}

	metadata, err := msg.GetMetadata()
	if err != nil {
		t.Fatalf("error getting metadata: %v", err)
	}

	if metadata.Metadata.Name != "ABC" {
		t.Fatalf("expected ABC, got %v", metadata.Metadata.Name)
	}
}
