import { Component, Input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
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

@Component({
  selector: 'app-transaction-flow-modal',
  templateUrl: './transaction-flow-modal.page.html',
  styleUrls: ['./transaction-flow-modal.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterLink, LottieComponent]
})
export class TransactionFlowModalPage implements OnInit {

  @Input() urn: string = '';
  @Input() metadata: string;
  @Input() data: string;

  errorText: string = '';
  txHash: string = 'DF2B7C3EE43DADB9F1C0CB30EA4BE045886989BBAC164F7DBD312268BEC8E9C9';
  state: 'sign' | 'submit' | 'success' | 'error' | 'long' = 'sign';
  explorerTxUrl: string = environment.api.explorer;

  constructor(private walletService: WalletService, private chainService: ChainService, private modalCtrl: ModalController) {
    this.urn = '';
    this.metadata = '';
    this.data = '';
    this.txHash = '';
  }

  ngOnInit() {
    addIcons({ checkmark, closeOutline, close });
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
      // for 30 seconds. If the transaction isn't successful after 30 seconds 
      // show a 'taking longer than usual' message, fail after 180 seconds
      for (let i = 0; i < 180; i++) {
        await delay(1000);
        if (i >= 30) {
          this.state = 'long';
        }
        try {
          const tx = await this.chainService.fetchTransaction(this.txHash);
          if (tx) {
            if (tx.code == 0) {
              this.state = 'success';
              return;
            }
          }
        }
        catch (e) {
          console.log(e);
        }
      }


      // Then check the backend is the TX is indexed


      // this.state = 'success';
      // await loading.dismiss();

      // // Redirect to the view page
      // this.router.navigate(["/app/inscription", result]);

    } catch (error: any) {
      this.state = 'error';

      if (error instanceof Error) {
        this.errorText = error.message;
      }
      // await alert.dismiss();
    }
  }

  cancel() {
    this.modalCtrl.dismiss();
  }

}
