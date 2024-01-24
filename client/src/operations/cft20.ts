import CFT20Protocol from '../metaprotocol/cft20.js'
import { OperationsBase } from './index.js'

interface DeployParams {
  name: string
  ticker: string
  maxSupply: number
  decimals: number
  mintLimit: number
  openTime: Date
}

export class CFT20Operations extends OperationsBase {
  protocol: CFT20Protocol
  address: string

  constructor(chainId: string, address: string) {
    super()
    this.protocol = new CFT20Protocol(chainId)
    this.address = address
  }

  deploy(data: string | Buffer, mime: string, params: DeployParams) {
    const inscription = this.protocol.createLogoInscription(
      this.address,
      data,
      mime,
    )
    const operation = this.protocol.deploy(
      params.name,
      params.ticker,
      params.maxSupply,
      params.decimals,
      params.mintLimit,
      params.openTime,
    )
    return this.prepareOperation(operation, inscription)
  }

  mint(ticker: string, amount: number) {
    return this.prepareOperation(this.protocol.mint(ticker, amount))
  }

  transfer(ticker: string, amount: number, destination: string) {
    return this.prepareOperation(
      this.protocol.transfer(ticker, amount, destination),
    )
  }
}
