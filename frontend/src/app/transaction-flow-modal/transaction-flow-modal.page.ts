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

@Component({
  selector: 'app-transaction-flow-modal',
  templateUrl: './transaction-flow-modal.page.html',
  styleUrls: ['./transaction-flow-modal.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterLink, LottieComponent]
})
export class TransactionFlowModalPage implements OnInit {

  @Input() routerLink: string = '';
  @Input() urn: string = '';
  @Input() metadata: string;
  @Input() data: string;

  errorText: string = '';
  txHash: string = '';
  state: 'sign' | 'submit' | 'success-onchain' | 'success-indexer' | 'success-inscribed' | 'failed' | 'error' | 'long' = 'sign';
  explorerTxUrl: string = environment.api.explorer;
  chain: any = null;

  constructor(private walletService: WalletService, private chainService: ChainService, private modalCtrl: ModalController, private router: Router) {
    this.urn = '';
    this.metadata = '';
    this.data = '';
    this.txHash = '';
  }

  ngOnInit() {
    addIcons({ checkmark, closeOutline, close });
    this.chain = Chain(environment.api.endpoint)
  }

  async submit() {
    this.state = 'sign';
    this.errorText = '';

    // this.walletService.simulate(this.urn, this.metadata, this.data);

    try {
      const signedTx = await this.walletService.sign(this.urn, this.metadata, this.data);
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
          console.log(e);
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

    return error;
  }

  viewInscription() {
    this.router.navigate([this.routerLink, this.txHash]);
    this.modalCtrl.dismiss();
  }

}
