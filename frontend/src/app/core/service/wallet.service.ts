import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { WalletStatus } from '../enum/wallet-status.enum';
import { defaultRegistryTypes, SigningStargateClient } from '@cosmjs/stargate';
import { ChainService } from './chain.service';
import { Coin, coin, makeStdTx, StdSignDoc } from '@cosmjs/amino';
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
import { TxFee } from '../types/tx-fee';
import { SignClient } from '@walletconnect/sign-client';
import { KeplrWalletConnectV2 } from '@keplr-wallet/wc-client';

@Injectable({
  providedIn: 'root'
})
export class WalletService {

  constructor(private chainService: ChainService) { }

  hasWallet() {
    if (!window.keplr) {
      return false;
    }
    return true;
  }

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
      // Prefer the users can't change the memo we set
      window.keplr.defaultOptions = {
        sign: {
          preferNoSetMemo: true,
        }
      }

      await window.keplr.experimentalSuggestChain(environment.chain);
      await window.keplr.enable(environment.chain.chainId);
      return WalletStatus.Connected;
    } catch (error) {
      return WalletStatus.Rejected;
    }
  }

  async disconnect() {
    if (!window.keplr) {
      throw new Error('Keplr extension is not available');
    }
    console.log("DISCONNECTED");
    await window.keplr.disable();
  }

  /**
   * Check if Keplr is connected
   * @returns boolean
   */
  async isConnected() {
    if (!window.keplr) {
      return false
    }

    if (localStorage.getItem(environment.storage.connectedWalletKey)) {
      return true;
    }
    return false;

    // const signer = await this.getSigner();
    // if (signer) {
    //   return true;
    // }
    // return false;
  }

  /**
   * Create a simulation transaction to estimate Gas with
   * @param urn The metaprotocol URN for the inscription
   * @param metadata The metadata about the inscription
   * @param data The inscription data
   * @returns 
   */
  async createSimulated(urn: string, metadata: string | null, data: string | null, fees: TxFee, messages: any[]) {

    const account = await this.getAccount();

    let nonCriticalExtensionOptions: any[] = [];
    // We only add the nonCriticalExtensionOptions inscription if the protocol
    // requires it
    if (metadata && data) {
      nonCriticalExtensionOptions = [
        {
          // This typeUrl isn't really important here as long as it is a type
          // that the chain recognises it
          '@type': "/cosmos.authz.v1beta1.MsgRevoke",
          granter: metadata,
          grantee: data,
          msgTypeUrl: `${urn}`,
        }
      ];
    }

    try {
      const accountInfo = await this.chainService.fetchAccountInfo(account.address);
      const msgs = {
        '@type': "/cosmos.bank.v1beta1.MsgSend",
        from_address: account?.address as string,
        to_address: fees.metaprotocol.receiver,
        amount: [
          {
            denom: fees.metaprotocol.denom,
            amount: fees.metaprotocol.amount,
          },
        ],
      }

      const signDoc = {
        body: {
          messages: [...messages, msgs],
          memo: urn,
          timeout_height: "0",
          extension_options: [],
          nonCriticalExtensionOptions,
        },
        auth_info: {
          signer_infos: [
            {
              public_key: {
                '@type': "/cosmos.crypto.secp256k1.PubKey",
                key: Buffer.from(account.pubkey).toString('base64')
              },
              mode_info: {
                single: {
                  mode: "SIGN_MODE_DIRECT",
                },
              },
              sequence: accountInfo.sequence,
            },
          ],
          fee: {
            amount: [],
            gas_limit: environment.fees.chain.gasLimit,
            payer: "",
            granter: "",
          }
        },
        chain_id: environment.chain.chainId,
        account_number: accountInfo.account_number

      };


      const tx = {
        tx: {
          body: signDoc.body,
          auth_info: signDoc.auth_info,
          signatures: ["8jXh7aU3pIE07HBva+W/GLEO0xc5QMu5EXR6hglL2fFVP8AXsMbiNR5Et8POJXJZLWE58wc1ni8rzxF7d/cv5g=="], // Locally generated, doesn't matter
        }
      }
      return JSON.stringify(tx);
    }
    catch (error) {
      throw error;
    }

  }

  /**
   * Sign the inscription transaction
   * 
   * @param urn The metaprotocol URN for the inscription
   * @param metadata The metadata about the inscription
   * @param data The inscription data
   * @returns 
   */
  async sign(urn: string, metadata: string | null, data: string | null, fees: TxFee, messages: any[] = []) {
    const signer = await this.getSigner();
    const account = await this.getAccount();

    let nonCriticalExtensionOptions: any[] = [];
    // We only add the nonCriticalExtensionOptions inscription if the protocol
    // requires it
    if (metadata && data) {
      nonCriticalExtensionOptions = [
        {
          // This typeUrl isn't really important here as long as it is a type
          // that the chain recognises it
          typeUrl: "/cosmos.authz.v1beta1.MsgRevoke",
          value: MsgRevoke.encode(
            MsgRevoke.fromPartial({
              granter: metadata,
              grantee: data,
              msgTypeUrl: `${environment.domain} metaprotocol`,
            })
          ).finish(),
        }
      ];
    }

    try {
      const accountInfo = await this.chainService.fetchAccountInfo(account.address);
      const feeMessage = {
        typeUrl: "/cosmos.bank.v1beta1.MsgSend",
        value: MsgSend.encode({
          fromAddress: account?.address as string,
          toAddress: fees.metaprotocol.receiver,
          amount: [
            {
              denom: fees.metaprotocol.denom,
              amount: fees.metaprotocol.amount,
            }
          ],
        }).finish(),
      }

      const signDoc = {
        bodyBytes: TxBody.encode(
          TxBody.fromPartial({
            messages: [...messages, feeMessage],
            memo: urn,
            nonCriticalExtensionOptions,
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
            amount: {
              denom: fees.chain.denom,
              amount: fees.chain.amount,
            },
            gasLimit: environment.fees.chain.gasLimit,
          }),
        }).finish(),

        chainId: environment.chain.chainId,
        accountNumber: Long.fromNumber(accountInfo.account_number),
      };

      // We use the direct signer so that we can inscribe using 
      // nonCriticalExtensionOptions
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
    catch (error) {
      throw error;
    }
  }

  async getAccountMobile() {
    return {
      address: "cosmos1m857lgtjssgt0wm3crzfmt3v950vqnkqq29mmz",
    }
  }

  async signMobile(urn: string, metadata: string | null, data: string | null, fees: TxFee, messages: any[] = []) {
    const signClient = await SignClient.init({
      // If do you have your own project id, you can set it.
      projectId: "3a90436d11f4e6f16f47a9e2c7de2355",
      metadata: {
        name: "Asteroid Protocol",
        description: "The metaprotocol standard for Cosmos",
        url: "http://192.168.11.103:8100",
        icons: [
          "https://raw.githubusercontent.com/chainapsis/keplr-wallet/master/packages/extension/src/public/assets/logo-256.png",
        ],
      },
    });


    if (signClient.session.getAll().length <= 0) {
      alert("connect now");
      console.log("connect now");
      // const modal = new KeplrQRCodeModalV2(signClient);

      const { uri, approval } = await signClient.connect({
        requiredNamespaces: {
          cosmos: {
            methods: [
              "cosmos_getAccounts",
              "cosmos_signDirect",
              "cosmos_signAmino",
              "keplr_getKey",
              "keplr_signAmino",
              "keplr_signDirect",
              "keplr_signArbitrary",
              "keplr_enable",
            ],
            chains: [`cosmos:cosmoshub-4`],
            events: ["accountsChanged", "chainChanged", "keplr_accountsChanged"],
          },
        },
      });

      if (!uri) {
        // this.errorText = "no uri";
        alert("no sesh");
        throw new Error("No uri");
      } else {

        try {
          console.log("URI", uri);
          // document.location.href = uri;
          // this.errorText = uri;
          document.location.href = `keplrwallet://wcV2?${uri}`;
          const session = await approval();
          console.log("SESSION", session);
          alert("got sesh");
        }
        catch (error) {
          alert("err" + error);
        }

        // this.errorText = JSON.stringify(session);

        // Try to sign a transaction
        // keplr = new KeplrWalletConnectV2(signClient, {
        //   // sendTx,
        // });
      }

      // You can pass the chain ids that you want to connect to the modal.
      // const sessionProperties = await modal.connect(["cosmoshub-4"]);


    }

    // let account = {
    //   address: "cosmos1",
    //   pubkey: "",
    // };

    let nonCriticalExtensionOptions: any[] = [];
    try {
      const keplrWC2 = new KeplrWalletConnectV2(signClient, {
        // sendTx,
      });

      const signer = keplrWC2.getOfflineSigner("cosmoshub-4");
      const accounts = await signer.getAccounts();
      const account = accounts[0];

      // We only add the nonCriticalExtensionOptions inscription if the protocol
      // requires it
      if (metadata && data) {
        nonCriticalExtensionOptions = [
          {
            // This typeUrl isn't really important here as long as it is a type
            // that the chain recognises it
            typeUrl: "/cosmos.authz.v1beta1.MsgRevoke",
            value: MsgRevoke.encode(
              MsgRevoke.fromPartial({
                granter: metadata,
                grantee: data,
                msgTypeUrl: `${environment.domain} metaprotocol`,
              })
            ).finish(),
          }
        ];
      }

      const accountInfo = await this.chainService.fetchAccountInfo(account.address);
      const feeMessage = {
        typeUrl: "/cosmos.bank.v1beta1.MsgSend",
        value: MsgSend.encode({
          fromAddress: account?.address as string,
          toAddress: fees.metaprotocol.receiver,
          amount: [
            {
              denom: fees.metaprotocol.denom,
              amount: fees.metaprotocol.amount,
            }
          ],
        }).finish(),
      }

      const signDoc = {
        bodyBytes: TxBody.encode(
          TxBody.fromPartial({
            messages: [...messages, feeMessage],
            memo: urn,
            nonCriticalExtensionOptions,
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
            amount: {
              denom: fees.chain.denom,
              amount: fees.chain.amount,
            },
            gasLimit: environment.fees.chain.gasLimit,
          }),
        }).finish(),

        chainId: environment.chain.chainId,
        accountNumber: Long.fromNumber(accountInfo.account_number),
      };

      // We use the direct signer so that we can inscribe using 
      // nonCriticalExtensionOptions
      alert("signing");
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
    catch (error) {
      throw JSON.stringify(error);
    }
  }

  async simulate(urn: string, metadata: string | null, data: string | null) {
    // TODO: Implement simulation to get gas estimate
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

      if (tx.length >= 1048576) {
        console.error("tx too large");
        return "ERR: Transaction will be too large, multiple tx inscriptions not yet implemented";
      } else {

        const txHash = await client.broadcastTxSync(tx);
        // console.log(txHash);
        return txHash;
      }
    } catch (error) {
      console.error('Error in sendTransaction:', error);
      return "ERROR";
    }

  }
}
