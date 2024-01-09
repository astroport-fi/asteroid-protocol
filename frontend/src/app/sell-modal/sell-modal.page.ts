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
  selector: 'app-sell-modal',
  templateUrl: './sell-modal.page.html',
  styleUrls: ['./sell-modal.page.scss'],
  standalone: true,
  imports: [IonicModule, ReactiveFormsModule, CommonModule, FormsModule, RouterLink, LottieComponent, MaskitoModule]
})
export class SellModalPage implements OnInit {

  @Input() ticker: string = 'tokens';

  sellForm: FormGroup;

  readonly numberMask: MaskitoOptions;
  readonly decimalMask: MaskitoOptions;

  readonly maskPredicate: MaskitoElementPredicateAsync = async (el) => (el as HTMLIonInputElement).getInputElement();
  readonly decimalMaskPredicate: MaskitoElementPredicateAsync = async (el) => (el as HTMLIonInputElement).getInputElement();

  constructor(private walletService: WalletService, private chainService: ChainService, private modalCtrl: ModalController, private router: Router, private builder: FormBuilder, private protocolService: CFT20Service) {
    addIcons({ checkmark, closeOutline, close });

    this.sellForm = this.builder.group({
      basic: this.builder.group({
        amount: [10, [Validators.required, Validators.pattern("^[0-9. ]*$")]],
        price: [0.55, [Validators.required, Validators.pattern("^[0-9. ]*$")]],
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
    if (!this.sellForm.valid) {
      this.sellForm.markAllAsTouched();
      return;
    }

    // Close the sell modal
    this.modalCtrl.dismiss();

    // Construct metaprotocol memo message
    const params = new Map([
      ["tic", this.ticker],
      ["amt", this.sellForm.value.basic.amount],
      ["ppt", this.sellForm.value.basic.price],
    ]);
    const urn = this.protocolService.buildURN(environment.chain.chainId, 'list', params);
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
        metaprotocolAction: 'list',
      }
    });
    modal.present();
  }

  cancel() {
    this.modalCtrl.dismiss();
  }

}
