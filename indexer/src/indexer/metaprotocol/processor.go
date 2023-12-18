package metaprotocol

type Processor interface {
	Name() string
	Process(protocolData string, metadata []byte, data []byte) error
}
