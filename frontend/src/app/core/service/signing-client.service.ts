import { Injectable } from '@angular/core';
import { SigningStargateClient, TxData } from '@asteroid-protocol/sdk';
import { GasPrice, calculateFee } from '@cosmjs/stargate';
import { environment } from 'src/environments/environment';
import { WalletService } from './wallet.service';

@Injectable({
  providedIn: 'root',
})
export class SigningClientService {
  private _client: SigningStargateClient | undefined;
  private gasPrice: GasPrice;

  constructor(private walletService: WalletService) {
    const chainFee = environment.chain.feeCurrencies[0];
    this.gasPrice = GasPrice.fromString(
      `${chainFee.gasPriceStep.average}${chainFee.coinMinimalDenom}`,
    );
  }

  async getClient() {
    if (this._client) {
      return this._client;
    }

    const signer = await this.walletService.getSigner();

    this._client = await SigningStargateClient.connectWithSigner(
      environment.chain.rpc,
      signer,
      {
        gasPrice: this.gasPrice,
      },
    );

    return this._client;
  }

  async simulate(txData: TxData) {
    const client = await this.getClient();
    const address = await this.walletService.getAddress();
    return client.simulate(
      address,
      txData.messages,
      txData.memo,
      txData.nonCriticalExtensionOptions,
    );
  }

  async estimate(txData: TxData) {
    const client = await this.getClient();
    const address = await this.walletService.getAddress();
    const usedFee = await client.estimate(
      address,
      txData.messages,
      txData.memo,
      txData.nonCriticalExtensionOptions,
    );
    return parseInt(usedFee.amount[0].amount);
  }

  async signAndBroadcast(txData: TxData) {
    const client = await this.getClient();
    const address = await this.walletService.getAddress();
    return client.signAndBroadcast(
      address,
      txData.messages,
      'auto',
      txData.memo,
      undefined,
      txData.nonCriticalExtensionOptions,
    );
  }
}
