import { Component, Input, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { MaskitoElementPredicateAsync, MaskitoOptions } from '@maskito/core';
import { maskitoNumberOptionsGenerator } from '@maskito/kit';
import { MaskitoModule } from '@maskito/angular';
import { CFT20Service } from '../core/metaprotocol/cft20.service';
import { TransactionFlowModalPage } from '../transaction-flow-modal/transaction-flow-modal.page';

@Component({
  selector: 'app-transfer-modal',
  templateUrl: './transfer-modal.page.html',
  styleUrls: ['./transfer-modal.page.scss'],
  standalone: true,
  imports: [IonicModule, ReactiveFormsModule, CommonModule, FormsModule, RouterLink, LottieComponent, MaskitoModule]
})
export class TransferModalPage implements OnInit {

  @Input() ticker: string = 'tokens';

  transferForm: FormGroup;

  readonly numberMask: MaskitoOptions;
  readonly decimalMask: MaskitoOptions;

  readonly maskPredicate: MaskitoElementPredicateAsync = async (el) => (el as HTMLIonInputElement).getInputElement();
  readonly decimalMaskPredicate: MaskitoElementPredicateAsync = async (el) => (el as HTMLIonInputElement).getInputElement();

  constructor(private walletService: WalletService, private chainService: ChainService, private modalCtrl: ModalController, private router: Router, private builder: FormBuilder, private protocolService: CFT20Service) {
    addIcons({ checkmark, closeOutline, close });

    this.transferForm = this.builder.group({
      basic: this.builder.group({
        destination: ['', [Validators.required, Validators.minLength(45), Validators.maxLength(45), Validators.pattern("^[a-zA-Z0-9]*$")]],
        amount: [10, [Validators.required, Validators.pattern("^[0-9. ]*$")]],
      }),
    });

    this.numberMask = maskitoNumberOptionsGenerator({
      decimalSeparator: '.',
      thousandSeparator: ' ',
      precision: 0,
      min: 1.000000,
    });

    this.decimalMask = maskitoNumberOptionsGenerator({
      decimalSeparator: '.',
      thousandSeparator: ' ',
      precision: 6,
      min: 0,
    });
  }

  async ngOnInit() {

  }

  async submit() {
    if (!this.transferForm.valid) {
      this.transferForm.markAllAsTouched();
      return;
    }
    // Close the transfer modal
    this.modalCtrl.dismiss();

    // Construct metaprotocol memo message
    const params = new Map([
      ["tic", this.ticker],
      ["amt", this.transferForm.value.basic.amount],
      ["dst", this.transferForm.value.basic.destination],
    ]);
    const urn = this.protocolService.buildURN(environment.chain.chainId, 'transfer', params);
    const modal = await this.modalCtrl.create({
      keyboardClose: true,
      backdropDismiss: false,
      component: TransactionFlowModalPage,
      componentProps: {
        urn,
        metadata: null,
        data: null,
        routerLink: ['/app/manage/token', this.ticker],
        resultCTA: 'View transaction',
        metaprotocol: 'cft20',
        metaprotocolAction: 'transfer',
      }
    });

    modal.present();
  }

  cancel() {
    this.modalCtrl.dismiss();
  }

}
