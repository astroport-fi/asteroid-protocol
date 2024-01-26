import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { WalletStatus } from '../enum/wallet-status.enum';
import { defaultRegistryTypes, SigningStargateClient } from '@cosmjs/stargate';
import { AccountResponse } from '../types/account-response';
import { api } from '../helpers/api';
import { TxQueryResponse } from '../types/tx-response';
import { GasSimulateResponse } from '../types/gas-simulate-response';


@Injectable({
  providedIn: 'root'
})
export class ChainService {

  constructor() { }

  async fetchAccountInfo(address: string) {
    try {
      const uri = `${environment.api.simulateEndpoint}/cosmos/auth/v1beta1/accounts/${address}`;
      const response = await api<AccountResponse>(uri);

      return response.account;
    } catch (e) {
      throw new Error(`This may be a new account. Please send some tokens to this account first.`);
    }
  }

  async fetchTransaction(hash: string) {
    try {
      const uri = `${environment.api.simulateEndpoint}/cosmos/tx/v1beta1/txs/${hash}`;
      const response = await api<TxQueryResponse>(uri);

      return response.tx_response;
    } catch (e) {
      throw new Error(`Transaction not found`);
    }
  }

  async simulateTransaction(tx: string) {
    try {

      const call = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: tx
      }
      console.log("Using simulate endpoint");
      const uri = `${environment.api.simulateEndpoint}/cosmos/tx/v1beta1/simulate`;
      const response = await api<GasSimulateResponse>(uri, call);

      return response.gas_info;
    } catch (e: any) {
      throw new Error(`Failed to simulate transaction` + (e?.message ?? e));
    }
  }

}
