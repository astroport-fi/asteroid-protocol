import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { WalletStatus } from '../enum/wallet-status.enum';
import { defaultRegistryTypes, SigningStargateClient } from '@cosmjs/stargate';
import { ChainService } from './chain.service';
import { Coin, coin, makeStdTx } from '@cosmjs/amino';
import { SignDoc, AuthInfo } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { MsgRevoke } from "cosmjs-types/cosmos/authz/v1beta1/tx";
import { SignMode } from "cosmjs-types/cosmos/tx/signing/v1beta1/signing";
import { TxRaw, TxBody, Fee } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { Any } from "cosmjs-types/google/protobuf/any";
import { fromBase64 } from "@cosmjs/encoding";
import { PubKey } from "cosmjs-types/cosmos/crypto/secp256k1/keys";
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";
import { Buffer } from "buffer";
import Long from 'long';

@Injectable({
  providedIn: 'root'
})
export class WalletService {

  constructor(private chainService: ChainService) { }

  /**
   * Get the Keplr signer
   * @returns OfflineSigner
   */
  async getSigner() {
    if (!window.keplr) {
      throw new Error('Keplr extension is not available');
    }
    return window.keplr.getOfflineSigner(environment.chain.chainId);
  }

  /**
   * Get the first account for this wallet
   * @returns AccountData for the account
   */
  async getAccount() {
    if (!window.keplr) {
      throw new Error('Keplr extension is not available');
    }
    const signer = await this.getSigner();
    const accounts = await signer.getAccounts();

    // Just return the first account for now
    return accounts[0];
  }

  /**
   * Suggest and connect Keplr
   * @returns WalletStatus based on the connection status
   */
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

  /**
   * Check if Keplr is connected
   * @returns boolean
   */
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

  /**
   * Sign the inscription transaction
   * 
   * @param metadata The metadata about the inscription
   * @param data The inscription data
   * @returns 
   */
  async sign(inscriptionType: string, metadata: string, data: string) {
    const signer = await this.getSigner();
    const account = await this.getAccount();

    const accountInfo = await this.chainService.fetchAccountInfo(account.address);
    if (!accountInfo) {
      throw new Error("Account not found");
    }

    console.log(accountInfo);

    const protoMsgs = {
      typeUrl: "/cosmos.bank.v1beta1.MsgSend",
      value: MsgSend.encode({
        fromAddress: account?.address as string,
        toAddress: environment.fees.protocol.receiver,
        amount: [
          ...environment.fees.protocol.amount,
        ],
      }).finish(),
    }

    const signDoc = {
      bodyBytes: TxBody.encode(
        TxBody.fromPartial({
          messages: [protoMsgs],
          memo: "",
          nonCriticalExtensionOptions: [
            {
              typeUrl: "/cosmos.authz.v1beta1.MsgRevoke",
              value: MsgRevoke.encode(
                MsgRevoke.fromPartial({
                  granter: metadata,
                  grantee: data,
                  msgTypeUrl: inscriptionType,
                })
              ).finish(),
            }
          ],
        })
      ).finish(),
      authInfoBytes: AuthInfo.encode({
        signerInfos: [
          {
            publicKey: {
              typeUrl: "/cosmos.crypto.secp256k1.PubKey",
              value: PubKey.encode({
                key: account.pubkey,
              }).finish(),
            },
            modeInfo: {
              single: {
                mode: SignMode.SIGN_MODE_DIRECT,
              },
            },
            sequence: BigInt(accountInfo.sequence),
          },
        ],
        fee: Fee.fromJSON({
          amount: environment.fees.chain.amount,
          gasLimit: environment.fees.chain.gasLimit,
        }),
      }).finish(),
      chainId: environment.chain.chainId,
      accountNumber: Long.fromNumber(accountInfo.account_number)
    };
    const signed = await signer.signDirect(account.address, signDoc);
    const signedTx = {
      tx: TxRaw.encode({
        bodyBytes: signed.signed.bodyBytes,
        authInfoBytes: signed.signed.authInfoBytes,
        signatures: [Buffer.from(signed.signature.signature, "base64")],
      }).finish(),
      signDoc: signed.signed,
    }
    return signedTx.tx;
  }

  /**
   * Broadcast the inscription transaction
   * @param tx The inscription transaction
   * @returns 
   */
  async broadcast(tx: Uint8Array) {
    try {
      const signer = await this.getSigner();
      const client = await SigningStargateClient.connectWithSigner(environment.chain.rpc, signer);
      console.log("sending", tx.length);
      if (tx.length >= 1048576) {
        console.error("tx too large");
        return "ERR: Transaction will be too large, multiple tx inscriptions not yet implemented";
      } else {

        const txHash = await client.broadcastTxSync(tx);
        console.log(txHash);
        return txHash;
      }
    } catch (error) {
      console.error('Error in sendTransaction:', error);
      return "ERROR";
    }

  }
}
