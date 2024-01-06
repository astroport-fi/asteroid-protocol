import { Component, Input, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronForward, keySharp, pencilSharp, createSharp, checkmark, closeOutline, close } from "ionicons/icons";
import { LottieComponent } from 'ngx-lottie';
import { WalletService } from '../core/service/wallet.service';
import { environment } from 'src/environments/environment';
import { ChainService } from '../core/service/chain.service';
import { delay } from '../core/helpers/delay';
import { Chain } from '../core/types/zeus';
import { TxFee } from '../core/types/tx-fee';

@Component({
  selector: 'app-transaction-flow-modal',
  templateUrl: './transaction-flow-modal.page.html',
  styleUrls: ['./transaction-flow-modal.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterLink, LottieComponent]
})
export class TransactionFlowModalPage implements OnInit {

  @Input() resultCTA: string = 'View inscription';
  @Input() routerLink: string | [] = '';
  @Input() urn: string = '';
  @Input() metadata: string;
  @Input() data: string;
  @Input() messages: any[] = [];

  isSimulating: boolean = true;
  errorText: string = '';
  txHash: string = '';
  state: 'sign' | 'submit' | 'success-onchain' | 'success-indexer' | 'success-inscribed' | 'failed' | 'error' | 'long' = 'sign';
  explorerTxUrl: string = environment.api.explorer;
  chain: any = null;
  currentChain = environment.chain;
  gasEstimate: number = parseInt(environment.fees.chain.gasLimit);
  chainFee: number = this.gasEstimate * this.currentChain.feeCurrencies[0].gasPriceStep.average / 1000000; // Divide by 1 million to get the fee in uatom since the gas price is in 0.005 uatom format
  protocolFee: number = 0.005;
  metaprotocol: string = 'inscription';
  metaprotocolAction: string = 'inscribe';

  constructor(private walletService: WalletService, private chainService: ChainService, private modalCtrl: ModalController, private router: Router) {
    this.urn = '';
    this.metadata = '';
    this.data = '';
    this.txHash = '';

    console.log("chainFee", this.chainFee);
  }

  async ngOnInit() {
    addIcons({ checkmark, closeOutline, close });
    this.chain = Chain(environment.api.endpoint)

    const fees: TxFee = {
      metaprotocol: {
        receiver: (environment.fees.protocol as any)[this.metaprotocol][this.metaprotocolAction].receiver,
        denom: (environment.fees.protocol as any)[this.metaprotocol][this.metaprotocolAction].denom,
        amount: (environment.fees.protocol as any)[this.metaprotocol][this.metaprotocolAction].amount,
      },
      chain: {
        denom: this.currentChain.feeCurrencies[0].coinMinimalDenom,
        amount: "0",
      }
    }
    this.protocolFee = parseInt(fees.metaprotocol.amount) / 10 ** this.currentChain.feeCurrencies[0].coinDecimals;

    this.gasEstimate = parseInt(environment.fees.chain.gasLimit);
    try {
      const simulateTx = await this.walletService.createSimulated(this.urn, this.metadata, this.data, fees, this.messages);
      const result = await this.chainService.simulateTransaction(simulateTx);

      if (result) {
        this.gasEstimate = parseInt(result.gas_used);
        // Bump gas by 20% to account for any changes
        this.gasEstimate = this.gasEstimate + (this.gasEstimate * 0.2);

        // Divide by 1 million to get the fee in uatom since the gas price is in 0.005 uatom format
        this.chainFee = (this.gasEstimate * this.currentChain.feeCurrencies[0].gasPriceStep.average) / 1000000;

        // Bump the chain fee by 20% to account for extra storage needed
        this.chainFee = this.chainFee + (this.chainFee * 0.2);
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
        receiver: (environment.fees.protocol as any)[this.metaprotocol][this.metaprotocolAction].receiver,
        denom: (environment.fees.protocol as any)[this.metaprotocol][this.metaprotocolAction].denom,
        amount: (environment.fees.protocol as any)[this.metaprotocol][this.metaprotocolAction].amount,
      },
      chain: {
        denom: this.currentChain.feeCurrencies[0].coinMinimalDenom,
        amount: this.chainFee.toString(),
      }
    }

    try {
      // const signedTx = await this.walletService.sign(this.urn, this.metadata, this.data, fees, this.messages);

      const signedTx = await this.walletService.signMobile(this.urn, this.metadata, this.data, fees, this.messages);
      this.state = 'submit';
      this.txHash = await this.walletService.broadcast(signedTx);

      // Keep checking the chain is this TX is successful every second
      // for 60 seconds. If the transaction isn't successful after 60 seconds 
      // show a 'taking longer than usual' message, fail after 180 seconds
      for (let i = 0; i < 180; i++) {
        await delay(1000);
        if (i >= 60) {
          this.state = 'long';
        }
        try {
          if (this.state == 'submit' || this.state == 'long') {
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
                      _eq: this.txHash
                    }
                  }
                }, {
                  id: true,
                  hash: true,
                  status_message: true,
                }
              ]
            });

            if (result.transaction.length > 0) {
              this.state = 'success-indexer';
              // Indexer has it, keep checking until statusMessage changes
              // to something else than pending
              if (result.transaction[0].status_message.toLowerCase() == 'success') {
                this.state = 'success-inscribed';
                break;
              } else if (result.transaction[0].status_message.toLowerCase().includes('error')) {
                // We hit an error
                this.state = 'failed';
                this.errorText = this.mapToHumanError(result.transaction[0].status_message);
                break;
              }
            }
          }
        }
        catch (e) {
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
    if (error.includes('order by id') && error.includes('doesn\'t exist')) {
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
