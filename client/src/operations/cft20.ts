import CFT20Protocol from '../metaprotocol/cft20.js'
import { OperationsBase, Options, getDefaultOptions } from './index.js'

export interface DeployParams {
  name: string
  ticker: string
  maxSupply: number
  decimals: number
  mintLimit: number
  openTime: Date
  preMine?: number
}

export class CFT20Operations<
  T extends boolean = false,
> extends OperationsBase<T> {
  protocol: CFT20Protocol
  address: string
  options: Options<T>

  constructor(
    chainId: string,
    address: string,
    options: Options<T> = getDefaultOptions(),
  ) {
    super()
    this.protocol = new CFT20Protocol(chainId, options.fee)
    this.address = address
    this.options = options
  }

  deploy(data: Uint8Array, mime: string, params: DeployParams) {
    const inscriptionData = this.protocol.createLogoInscription(
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
      params.preMine,
    )
    return this.prepareOperation(operation, inscriptionData)
  }

  mint(ticker: string, amount: number) {
    return this.prepareOperation(this.protocol.mint(ticker, amount))
  }

  transfer(ticker: string, amount: number, destination: string) {
    return this.prepareOperation(
      this.protocol.transfer(ticker, amount, destination),
    )
  }

  burn(ticker: string, amount: number) {
    return this.prepareOperation(this.protocol.burn(ticker, amount))
  }

  delist(ticker: string, orderNumber: number) {
    return this.prepareOperation(this.protocol.delist(ticker, orderNumber))
  }
}
