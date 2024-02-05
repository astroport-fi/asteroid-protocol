import { DecimalPipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TxData } from '@asteroid-protocol/sdk';
import { IonicModule, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { helpCircleOutline } from 'ionicons/icons';
import { LottieComponent } from 'ngx-lottie';
import { environment } from 'src/environments/environment';
import { delay } from '../core/helpers/delay';
import { TokenDecimalsPipe } from '../core/pipe/token-with-decimals.pipe';
import { AsteroidService } from '../core/service/asteroid.service';
import { ChainService } from '../core/service/chain.service';
import { SigningClientService } from '../core/service/signing-client.service';

@Component({
  selector: 'app-transaction-modal-v2',
  templateUrl: './transaction-modal-v2.component.html',
  styleUrl: './transaction-modal-v2.component.scss',
  standalone: true,
  imports: [
    IonicModule,
    LottieComponent,
    TokenDecimalsPipe,
    RouterLink,
    DecimalPipe,
  ],
})
export class TransactionModalV2Component implements OnInit {
  @Input({ required: true }) txData!: TxData;
  @Input() resultCTA: string = 'View inscription';
  @Input() routerLink: string | [] = '';

  errorText: string = '';
  txHash: string = '';
  state:
    | 'estimate'
    | 'sign'
    | 'submit'
    | 'success-onchain'
    | 'success-indexer'
    | 'success-inscribed'
    | 'failed' = 'estimate';
  explorerTxUrl = environment.api.explorer;
  chainFee = 0;
  // @todo protocol fee
  protocolFee = 0;
  protocolFeeAbsolute = 0;

  constructor(
    private signingClientService: SigningClientService,
    private modalCtrl: ModalController,
    private chainService: ChainService,
    private asteroidService: AsteroidService,
    private router: Router,
  ) {
    addIcons({ helpCircleOutline });
  }

  async ngOnInit() {
    await this.estimate();
  }

  async estimate() {
    try {
      this.chainFee = await this.signingClientService.estimate(this.txData);
      this.state = 'sign';
    } catch (err) {
      this.setError(err);
    }
  }

  retry() {
    this.errorText = '';

    if (this.state == 'estimate') {
      return this.estimate();
    } else {
      return this.submit();
    }
  }

  async submit() {
    this.state = 'sign';

    try {
      const res = await this.signingClientService.signAndBroadcast(this.txData);
      this.txHash = res.transactionHash;
      if (res.code) {
        this.errorText = `Transaction failed with error code: ${res.code}`;
        return;
      }

      this.state = 'submit';
      await this.waitForTransaction();
    } catch (err) {
      this.setError(err);
    }
  }

  setError(error: unknown) {
    console.log(error);

    if (error instanceof Error) {
      this.errorText = error.message;
    }
  }

  async waitForTransaction() {
    // Keep checking the chain if this TX is successful every second
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
          const transactionStatus =
            await this.asteroidService.getTransactionStatus(this.txHash);

          if (transactionStatus) {
            this.state = 'success-indexer';
            // Indexer has it, keep checking until statusMessage changes
            // to something else than pending
            if (transactionStatus.toLowerCase() == 'success') {
              this.state = 'success-inscribed';
              break;
            } else if (transactionStatus.toLowerCase().includes('error')) {
              // We hit an error
              this.state = 'failed';
              this.errorText = this.mapToHumanError(transactionStatus);
              break;
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
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

  cancel() {
    this.modalCtrl.dismiss();
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
