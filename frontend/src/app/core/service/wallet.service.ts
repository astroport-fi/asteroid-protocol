import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { WalletStatus } from '../enum/wallet-status.enum';

@Injectable({
  providedIn: 'root'
})
export class WalletService {

  constructor() { }

  async getSigner() {
    if (!window.keplr) {
      throw new Error('Keplr extension is not available');
    }
    return window.keplr.getOfflineSigner(environment.chain.chainId);
  }

  async getAccount() {
    if (!window.keplr) {
      throw new Error('Keplr extension is not available');
    }
    const signer = await this.getSigner();
    const accounts = await signer.getAccounts();

    // Just return the first account for now
    return accounts[0];
  }

  async connect() {
    if (!window.keplr) {
      // TODO: Popup explaining that Keplr is needed and needs to be installed
      // first
      console.error('Keplr extension not found.');
      return WalletStatus.NotInstalled;
    }

    try {
      await window.keplr.experimentalSuggestChain(environment.chain);
      await window.keplr.enable(environment.chain.chainId);
      return WalletStatus.Connected;
    } catch (error) {
      return WalletStatus.Rejected;
    }
  }

  async isConnected() {
    if (!window.keplr) {
      return false
    }

    const signer = await this.getSigner();
    if (signer) {
      return true;
    }
    return false;
  }
}
