import { Component, Input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronForward, keySharp, pencilSharp, createSharp, checkmark, closeOutline, close } from "ionicons/icons";
import { LottieComponent } from 'ngx-lottie';
import { WalletService } from '../core/service/wallet.service';

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

  constructor(private walletService: WalletService) {
    // this.urn = '';
    this.metadata = '';
    this.data = '';
  }

  async ngOnInit() {
    addIcons({ checkmark, closeOutline, close });

    console.log("MESSAGE: " + this.urn);

    try {
      const signed = await this.walletService.sign(this.urn, this.metadata, this.data);

    } catch (error: any) {
      // this.isError = true;

      if (error instanceof Error) {
        this.errorText = error.message;
      }
      // await alert.dismiss();
    }

  }

}
