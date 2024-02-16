import { Injectable } from '@angular/core';
import { Coin, StdSignDoc, coin, makeStdTx } from '@cosmjs/amino';
import { SigningStargateClient, defaultRegistryTypes } from '@cosmjs/stargate';
import { Keplr } from '@keplr-wallet/types';
import { KeplrWalletConnectV2 } from '@keplr-wallet/wc-client';
import { SignClient } from '@walletconnect/sign-client';
import { Buffer } from 'buffer';
import { MsgRevoke } from 'cosmjs-types/cosmos/authz/v1beta1/tx';
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx';
import { PubKey } from 'cosmjs-types/cosmos/crypto/secp256k1/keys';
import { SignMode } from 'cosmjs-types/cosmos/tx/signing/v1beta1/signing';
import { AuthInfo, SignDoc } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { Fee, TxBody, TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { MsgTransfer } from 'cosmjs-types/ibc/applications/transfer/v1/tx';
import Long from 'long';
import { environment } from 'src/environments/environment';
import { WalletStatus } from '../enum/wallet-status.enum';
import { WalletType } from '../enum/wallet-type';
import { TxFee } from '../types/tx-fee';
import { ChainService } from './chain.service';

interface WalletProvider {
  id: string;
  name: string;
  walletType: WalletType;
  extensionResolver: () => Keplr | undefined;
  onInitialized?: (keplr: Keplr) => void;
}

declare global {
  interface Window {
    leap?: Keplr;
  }
}

const KeplrProvider: WalletProvider = {
  id: 'keplr',
  name: 'Keplr',
  walletType: WalletType.Keplr,
  extensionResolver() {
    return window.keplr;
  },
  onInitialized(keplr: Keplr) {
    keplr.defaultOptions = {
      sign: {
        preferNoSetFee: true,
        preferNoSetMemo: true,
      },
    };
  },
};

const LeapProvider: WalletProvider = {
  id: 'leap-cosmos',
  name: 'Leap Cosmos',
  walletType: WalletType.Leap,
  extensionResolver() {
    return window.leap;
  },
};

@Injectable({
  providedIn: 'root',
})
export class WalletService {
  private provider: WalletProvider;
  private _extension: Keplr | undefined;

  constructor(private chainService: ChainService) {
    this.provider = KeplrProvider;
  }

  get extension() {
    if (!this._extension) {
      throw new Error(`${this.provider.name} extension is not available`);
    }

    return this._extension;
  }

  setProvider(walletType: WalletType) {
    if (walletType == WalletType.Leap) {
      this.provider = LeapProvider;
    } else {
      this.provider = KeplrProvider;
    }

    this._extension = this.provider.extensionResolver?.();

    this.provider.onInitialized?.(this.extension);
  }

  hasWallet() {
    if (!window.keplr && !window.leap) {
      return false;
    }
    return true;
  }

  /**
   * Get the Keplr signer
   * @returns OfflineSigner
   */
  async getSigner() {
    return this.extension.getOfflineSigner(environment.chain.chainId);
  }

  /**
   * Get the first account for this wallet
   * @returns AccountData for the account
   */
  async getAccount() {
    const signer = await this.getSigner();
    const accounts = await signer.getAccounts();

    // Just return the first account for now
    return accounts[0];
  }

  /**
   * Suggest and connect Keplr
   * @returns WalletStatus based on the connection status
   */
  async connect(walletType: WalletType) {
    this.setProvider(walletType);

    if (!this._extension) {
      // TODO: Popup explaining that Keplr is needed and needs to be installed
      // first
      console.error('Keplr extension not found.');
      return WalletStatus.NotInstalled;
    }

    try {
      // TODO: Add back for local development
      await this.extension.experimentalSuggestChain(environment.chain);
      await this.extension.enable(environment.chain.chainId);
      return WalletStatus.Connected;
    } catch (error) {
      console.error(error);
      return WalletStatus.Rejected;
    }
  }

  async disconnect() {
    await this.extension.disable();
  }

  /**
   * Check if Keplr is connected
   * @returns boolean
   */
  async isConnected() {
    if (!this._extension) {
      return false;
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
  async createSimulated(
    urn: string,
    metadata: string | null,
    data: string | null,
    fees: TxFee,
    messages: any[],
  ) {
    const account = await this.getAccount();

    let nonCriticalExtensionOptions: any[] = [];
    // We only add the nonCriticalExtensionOptions inscription if the protocol
    // requires it
    if (metadata && data) {
      nonCriticalExtensionOptions = [
        {
          // This typeUrl isn't really important here as long as it is a type
          // that the chain recognises it
          '@type': '/cosmos.authz.v1beta1.MsgRevoke',
          granter: metadata,
          grantee: data,
          msgTypeUrl: urn,
        },
      ];
    }

    try {
      const accountInfo = await this.chainService.fetchAccountInfo(
        account.address,
      );

      let msgs = {};
      // const currentTime = Math.round(new Date().getTime() / 1000) + (60 * 60);

      let timeoutTime = new Date().getTime() + 60 * 60 * 1000; // 1 hour
      timeoutTime = timeoutTime * 1000000;

      if (parseInt(fees.metaprotocol.amount) > 0) {
        if (environment.fees.ibcChannel) {
          msgs = {
            '@type': '/ibc.applications.transfer.v1.MsgTransfer',
            receiver: fees.metaprotocol.receiver,
            sender: account?.address as string,
            source_channel: environment.fees.ibcChannel,
            source_port: 'transfer',
            timeout_timestamp: timeoutTime.toFixed(0),
            token: {
              amount: fees.metaprotocol.amount,
              denom: fees.metaprotocol.denom,
            },
          };
        } else {
          msgs = {
            '@type': '/cosmos.bank.v1beta1.MsgSend',
            from_address: account?.address as string,
            to_address: fees.metaprotocol.receiver,
            amount: [
              {
                denom: fees.metaprotocol.denom,
                amount: fees.metaprotocol.amount,
              },
            ],
          };
        }
      } else {
        // If no fee is charged, we need to send the smallest amount possible
        // to the sender to create a valid transaction
        // For the Hub that would be 0.000001 ATOM or 1uatom
        msgs = {
          '@type': '/cosmos.bank.v1beta1.MsgSend',
          from_address: account?.address as string,
          to_address: account?.address as string,
          amount: [
            {
              denom: fees.metaprotocol.denom,
              amount: '1',
            },
          ],
        };
      }

      const signDoc = {
        body: {
          messages: [...messages, msgs],
          memo: urn,
          timeout_height: '0',
          extension_options: [],
          nonCriticalExtensionOptions,
        },
        auth_info: {
          signer_infos: [
            {
              public_key: {
                '@type': '/cosmos.crypto.secp256k1.PubKey',
                key: Buffer.from(account.pubkey).toString('base64'),
              },
              mode_info: {
                single: {
                  mode: 'SIGN_MODE_DIRECT',
                },
              },
              sequence: accountInfo.sequence,
            },
          ],
          fee: {
            amount: [],
            gas_limit: environment.fees.chain.gasLimit,
            payer: '',
            granter: '',
          },
        },
        chain_id: environment.chain.chainId,
        account_number: accountInfo.account_number,
      };

      const tx = {
        tx: {
          body: signDoc.body,
          auth_info: signDoc.auth_info,
          signatures: [
            '8jXh7aU3pIE07HBva+W/GLEO0xc5QMu5EXR6hglL2fFVP8AXsMbiNR5Et8POJXJZLWE58wc1ni8rzxF7d/cv5g==',
          ], // Locally generated, doesn't matter
        },
      };
      return JSON.stringify(tx);
    } catch (error) {
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
  async sign(
    urn: string,
    metadata: string | null,
    data: string | null,
    fees: TxFee,
    messages: any[] = [],
  ) {
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
          typeUrl: '/cosmos.authz.v1beta1.MsgRevoke',
          value: MsgRevoke.encode(
            MsgRevoke.fromPartial({
              granter: metadata,
              grantee: data,
              msgTypeUrl: urn,
            }),
          ).finish(),
        },
      ];
    }

    try {
      const accountInfo = await this.chainService.fetchAccountInfo(
        account.address,
      );

      let msgs: any[] = [];
      let feeMessage = {};

      if (messages.length > 0) {
        msgs = [...messages];
      }

      let timeoutTime = new Date().getTime() + 60 * 60 * 1000;
      timeoutTime = timeoutTime * 1000000;

      if (parseInt(fees.metaprotocol.amount) > 0) {
        if (environment.fees.ibcChannel) {
          feeMessage = {
            typeUrl: '/ibc.applications.transfer.v1.MsgTransfer',
            value: MsgTransfer.encode({
              receiver: fees.metaprotocol.receiver,
              sender: account?.address as string,
              sourceChannel: environment.fees.ibcChannel,
              sourcePort: 'transfer',
              timeoutTimestamp: BigInt(timeoutTime),
              timeoutHeight: {
                revisionNumber: BigInt(0),
                revisionHeight: BigInt(0),
              },
              memo: '',
              token: {
                amount: fees.metaprotocol.amount,
                denom: fees.metaprotocol.denom,
              },
            }).finish(),
          };
        } else {
          feeMessage = {
            typeUrl: '/cosmos.bank.v1beta1.MsgSend',
            value: MsgSend.encode({
              fromAddress: account?.address as string,
              toAddress: fees.metaprotocol.receiver,
              amount: [
                {
                  denom: fees.metaprotocol.denom,
                  amount: fees.metaprotocol.amount,
                },
              ],
            }).finish(),
          };
        }

        msgs.push(feeMessage);
      } else if (messages.length == 0) {
        // If no fee is charged, we need to send the smallest amount possible
        // to the sender to create a valid transaction
        // For the Hub that would be 0.000001 ATOM or 1uatom
        // We only do this if there are no messages present
        feeMessage = {
          typeUrl: '/cosmos.bank.v1beta1.MsgSend',
          value: MsgSend.encode({
            fromAddress: account?.address as string,
            toAddress: account?.address as string,
            amount: [
              {
                denom: fees.metaprotocol.denom,
                amount: '1',
              },
            ],
          }).finish(),
        };
        msgs.push(feeMessage);
      }

      const signDoc = {
        bodyBytes: TxBody.encode(
          TxBody.fromPartial({
            messages: msgs,
            memo: urn,
            nonCriticalExtensionOptions,
          }),
        ).finish(),

        authInfoBytes: AuthInfo.encode({
          signerInfos: [
            {
              publicKey: {
                typeUrl: '/cosmos.crypto.secp256k1.PubKey',
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
          fee: {
            amount: [
              {
                denom: fees.chain.denom,
                amount: fees.chain.amount,
              },
            ],
            gasLimit: BigInt(fees.gasLimit),
            payer: '',
            granter: '',
          },
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
          signatures: [Buffer.from(signed.signature.signature, 'base64')],
        }).finish(),
        signDoc: signed.signed,
      };
      return signedTx.tx;
    } catch (error) {
      throw error;
    }
  }

  async getAccountMobile() {
    return {
      address: 'cosmos1m857lgtjssgt0wm3crzfmt3v950vqnkqq29mmz',
    };
  }

  async signMobile(
    urn: string,
    metadata: string | null,
    data: string | null,
    fees: TxFee,
    messages: any[] = [],
  ) {
    const signClient = await SignClient.init({
      // If do you have your own project id, you can set it.
      projectId: '3a90436d11f4e6f16f47a9e2c7de2355',
      metadata: {
        name: 'Asteroid Protocol',
        description: 'The metaprotocol standard for Cosmos',
        url: 'http://127.0.0.1:8100',
        icons: [
          'https://raw.githubusercontent.com/chainapsis/keplr-wallet/master/packages/extension/src/public/assets/logo-256.png',
        ],
      },
    });

    if (signClient.session.getAll().length <= 0) {
      const { uri, approval } = await signClient.connect({
        requiredNamespaces: {
          cosmos: {
            methods: [
              'cosmos_getAccounts',
              'cosmos_signDirect',
              'cosmos_signAmino',
              'keplr_getKey',
              'keplr_signAmino',
              'keplr_signDirect',
              'keplr_signArbitrary',
              'keplr_enable',
            ],
            chains: [`cosmos:cosmoshub-4`],
            events: [
              'accountsChanged',
              'chainChanged',
              'keplr_accountsChanged',
            ],
          },
        },
      });

      if (!uri) {
        // this.errorText = "no uri";
        alert('no sesh');
        throw new Error('No uri');
      } else {
        try {
          document.location.href = `keplrwallet://wcV2?${uri}`;
          const session = await approval();
        } catch (error) {
          alert('err' + error);
        }
      }
    }

    let nonCriticalExtensionOptions: any[] = [];
    try {
      const keplrWC2 = new KeplrWalletConnectV2(signClient, {
        // sendTx,
      });

      const signer = keplrWC2.getOfflineSigner('cosmoshub-4');
      const accounts = await signer.getAccounts();
      const account = accounts[0];

      // We only add the nonCriticalExtensionOptions inscription if the protocol
      // requires it
      if (metadata && data) {
        nonCriticalExtensionOptions = [
          {
            // This typeUrl isn't really important here as long as it is a type
            // that the chain recognises it
            typeUrl: '/cosmos.authz.v1beta1.MsgRevoke',
            value: MsgRevoke.encode(
              MsgRevoke.fromPartial({
                granter: metadata,
                grantee: data,
                msgTypeUrl: urn,
              }),
            ).finish(),
          },
        ];
      }

      const accountInfo = await this.chainService.fetchAccountInfo(
        account.address,
      );
      const feeMessage = {
        typeUrl: '/cosmos.bank.v1beta1.MsgSend',
        value: MsgSend.encode({
          fromAddress: account?.address as string,
          toAddress: fees.metaprotocol.receiver,
          amount: [
            {
              denom: fees.metaprotocol.denom,
              amount: fees.metaprotocol.amount,
            },
          ],
        }).finish(),
      };

      const signDoc = {
        bodyBytes: TxBody.encode(
          TxBody.fromPartial({
            messages: [...messages, feeMessage],
            memo: urn,
            nonCriticalExtensionOptions,
          }),
        ).finish(),

        authInfoBytes: AuthInfo.encode({
          signerInfos: [
            {
              publicKey: {
                typeUrl: '/cosmos.crypto.secp256k1.PubKey',
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
            gasLimit: fees.gasLimit,
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
          signatures: [Buffer.from(signed.signature.signature, 'base64')],
        }).finish(),
        signDoc: signed.signed,
      };
      return signedTx.tx;
    } catch (error) {
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
      const client = await SigningStargateClient.connectWithSigner(
        environment.chain.rpc,
        signer,
      );

      if (tx.length >= 1048576) {
        console.error('tx too large');
        return 'ERR: Transaction will be too large, multiple tx inscriptions not yet implemented';
      } else {
        const txHash = await client.broadcastTxSync(tx);
        return txHash;
      }
    } catch (error) {
      console.error('Error in sendTransaction:', error);
      return 'ERROR';
    }
  }
}
