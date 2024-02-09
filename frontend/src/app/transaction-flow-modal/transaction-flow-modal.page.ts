import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonicModule, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  checkmark,
  chevronForward,
  close,
  closeOutline,
  createSharp,
  helpCircleOutline,
  keySharp,
  pencilSharp,
} from 'ionicons/icons';
import { LottieComponent } from 'ngx-lottie';
import { environment } from 'src/environments/environment';
import { delay } from '../core/helpers/delay';
import { Chain } from '../core/helpers/zeus';
import { TokenDecimalsPipe } from '../core/pipe/token-with-decimals.pipe';
import { ChainService } from '../core/service/chain.service';
import { WalletService } from '../core/service/wallet.service';
import { TxFee } from '../core/types/tx-fee';

@Component({
  selector: 'app-transaction-flow-modal',
  templateUrl: './transaction-flow-modal.page.html',
  styleUrls: ['./transaction-flow-modal.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterLink,
    LottieComponent,
    TokenDecimalsPipe,
  ],
})
export class TransactionFlowModalPage implements OnInit {
  @Input() resultCTA: string = 'View inscription';
  @Input() routerLink: string | [] = '';
  @Input() urn: string = '';
  @Input() metadata: string;
  @Input() data: string;
  @Input() messages: any[] = [];
  @Input() messagesJSON: any[] = [];
  @Input() overrideFee: number = 0;

  isSimulating: boolean = true;
  errorText: string = '';
  txHash: string = '';
  state:
    | 'sign'
    | 'submit'
    | 'success-onchain'
    | 'success-indexer'
    | 'success-inscribed'
    | 'failed'
    | 'error' = 'sign';
  explorerTxUrl: string = environment.api.explorer;
  chain: Chain;
  currentChain = environment.chain;
  gasEstimate: number = parseInt(environment.fees.chain.gasLimit);
  chainFee: number =
    (this.gasEstimate *
      this.currentChain.feeCurrencies[0].gasPriceStep.average) /
    1000000; // Divide by 1 million to get the fee in uatom since the gas price is in 0.005 uatom format
  protocolFee: number = 0.005;
  protocolFeeAbsolute: number = 0.005;
  metaprotocol: string = 'inscription';
  metaprotocolAction: string = 'inscribe';

  constructor(
    private walletService: WalletService,
    private chainService: ChainService,
    private modalCtrl: ModalController,
    private router: Router,
  ) {
    this.urn = '';
    this.metadata = '';
    this.data = '';
    this.txHash = '';

    addIcons({ checkmark, closeOutline, close, helpCircleOutline });
    this.chain = Chain(environment.api.endpoint);
  }

  async ngOnInit() {
    const fees: TxFee = {
      metaprotocol: {
        receiver: (environment.fees.protocol as any)[this.metaprotocol][
          this.metaprotocolAction
        ].receiver,
        denom: (environment.fees.protocol as any)[this.metaprotocol][
          this.metaprotocolAction
        ].denom,
        amount: (environment.fees.protocol as any)[this.metaprotocol][
          this.metaprotocolAction
        ].amount,
      },
      chain: {
        denom: this.currentChain.feeCurrencies[0].coinMinimalDenom,
        amount: '0',
      },
      gasLimit: environment.fees.chain.gasLimit,
    };
    if (this.overrideFee > 0) {
      fees.metaprotocol.amount = this.overrideFee.toString();
    }

    this.protocolFee =
      parseInt(fees.metaprotocol.amount) /
      10 ** this.currentChain.feeCurrencies[0].coinDecimals;
    this.protocolFeeAbsolute = parseInt(fees.metaprotocol.amount);

    this.gasEstimate = parseInt(environment.fees.chain.gasLimit);
    try {
      const simulateTx = await this.walletService.createSimulated(
        this.urn,
        this.metadata,
        this.data,
        fees,
        this.messagesJSON,
      );
      const result = await this.chainService.simulateTransaction(simulateTx);

      if (result) {
        this.gasEstimate = parseInt(result.gas_used);
        // Bump gas by 60% to account for any changes
        this.gasEstimate = this.gasEstimate + this.gasEstimate * 0.6;

        // Divide by 1 million to get the fee in uatom since the gas price is in 0.005 uatom format
        this.chainFee =
          (this.gasEstimate *
            this.currentChain.feeCurrencies[0].gasPriceStep.average) /
          1000000;

        // Bump the chain fee by 40% to account for extra storage needed on top of the 40% gas bump
        this.chainFee = this.chainFee + this.chainFee * 0.4;

        // Convert to uatom
        this.chainFee =
          this.chainFee * 10 ** this.currentChain.feeCurrencies[0].coinDecimals;
      }
    } catch (error: any) {
      console.error(error);
    }
    this.isSimulating = false;
  }

  async submit() {
    this.state = 'sign';
    this.errorText = '';

    const fees: TxFee = {
      metaprotocol: {
        receiver: (environment.fees.protocol as any)[this.metaprotocol][
          this.metaprotocolAction
        ].receiver,
        denom: (environment.fees.protocol as any)[this.metaprotocol][
          this.metaprotocolAction
        ].denom,
        amount: (environment.fees.protocol as any)[this.metaprotocol][
          this.metaprotocolAction
        ].amount,
      },
      chain: {
        denom: this.currentChain.feeCurrencies[0].coinMinimalDenom,
        amount: this.chainFee.toFixed(0),
      },
      gasLimit: this.gasEstimate.toFixed(0),
    };
    if (this.protocolFeeAbsolute > 0) {
      fees.metaprotocol.amount = this.protocolFeeAbsolute.toString();
    }

    try {
      const signedTx = await this.walletService.sign(
        this.urn,
        this.metadata,
        this.data,
        fees,
        this.messages,
      );
      // const signedTx = await this.walletService.signMobile(this.urn, this.metadata, this.data, fees, this.messages);

      this.state = 'submit';
      this.txHash = await this.walletService.broadcast(signedTx);

      // Keep checking the chain is this TX is successful every second
      // for 180 seconds (3 minutes)
      for (let i = 0; i < 180; i++) {
        await delay(1000);
        try {
          if (this.state == 'submit') {
            const tx = await this.chainService.fetchTransaction(this.txHash);
            if (tx) {
              if (tx.code == 0) {
                this.state = 'success-onchain';
              }
            }
          } else {
            // Transaction was found on chain, now check indexer
            const result = await this.chain('query')({
              transaction: [
                {
                  where: {
                    hash: {
                      _eq: this.txHash,
                    },
                  },
                },
                {
                  id: true,
                  hash: true,
                  status_message: true,
                },
              ],
            });

            if (result.transaction.length > 0) {
              this.state = 'success-indexer';
              // Indexer has it, keep checking until statusMessage changes
              // to something else than pending
              if (
                result.transaction[0].status_message?.toLowerCase() == 'success'
              ) {
                this.state = 'success-inscribed';
                break;
              } else if (
                result.transaction[0].status_message
                  ?.toLowerCase()
                  .includes('error')
              ) {
                // We hit an error
                this.state = 'failed';
                this.errorText = this.mapToHumanError(
                  result.transaction[0].status_message,
                );
                break;
              }
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    } catch (error: any) {
      this.state = 'error';

      if (error instanceof Error) {
        this.errorText = error.message;
      }
    }
  }

  cancel() {
    this.modalCtrl.dismiss();
  }

  mapToHumanError(error: string) {
    if (error.includes('inscription_content_hash')) {
      return 'Your inscription contains content already inscribed. Duplicates are not allowed.';
    }
    if (error.includes('order by id') && error.includes("doesn't exist")) {
      return 'The sell order has already been filled or removed';
    }

    return error;
  }

  viewInscription() {
    if (typeof this.routerLink == 'string') {
      this.router.navigate([this.routerLink, this.txHash]);
    } else {
      this.router.navigate(this.routerLink);
    }
    this.modalCtrl.dismiss();
  }
}
