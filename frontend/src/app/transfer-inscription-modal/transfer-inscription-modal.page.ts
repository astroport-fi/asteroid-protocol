import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonicModule, ModalController } from '@ionic/angular';
import { MaskitoModule } from '@maskito/angular';
import { MaskitoElementPredicateAsync, MaskitoOptions } from '@maskito/core';
import { maskitoNumberOptionsGenerator } from '@maskito/kit';
import { addIcons } from 'ionicons';
import {
  checkmark,
  chevronForward,
  close,
  closeOutline,
  createSharp,
  keySharp,
  pencilSharp,
} from 'ionicons/icons';
import { LottieComponent } from 'ngx-lottie';
import { environment } from 'src/environments/environment';
import { delay } from '../core/helpers/delay';
import { Chain } from '../core/helpers/zeus';
import { CFT20Service } from '../core/metaprotocol/cft20.service';
import { InscriptionService } from '../core/metaprotocol/inscription.service';
import { StripSpacesPipe } from '../core/pipe/strip-spaces.pipe';
import { TokenDecimalsPipe } from '../core/pipe/token-with-decimals.pipe';
import { ChainService } from '../core/service/chain.service';
import { WalletService } from '../core/service/wallet.service';
import { TxFee } from '../core/types/tx-fee';
import { TransactionFlowModalPage } from '../transaction-flow-modal/transaction-flow-modal.page';

@Component({
  selector: 'app-transfer-inscription-modal',
  templateUrl: './transfer-inscription-modal.page.html',
  styleUrls: ['./transfer-inscription-modal.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    ReactiveFormsModule,
    CommonModule,
    FormsModule,
    RouterLink,
    LottieComponent,
    MaskitoModule,
    TokenDecimalsPipe,
    StripSpacesPipe,
  ],
})
export class TransferInscriptionModalPage implements OnInit {
  @Input() hash: string = '';

  transferForm: FormGroup;

  constructor(
    private walletService: WalletService,
    private chainService: ChainService,
    private modalCtrl: ModalController,
    private router: Router,
    private builder: FormBuilder,
    private protocolService: InscriptionService,
  ) {
    addIcons({ checkmark, closeOutline, close });

    this.transferForm = this.builder.group({
      basic: this.builder.group({
        destination: [
          '',
          [
            Validators.required,
            Validators.minLength(45),
            Validators.maxLength(45),
            Validators.pattern('^[a-zA-Z0-9]*$'),
          ],
        ],
      }),
    });
  }

  async ngOnInit() {
    const sender = await this.walletService.getAccount();

    const chain = Chain(environment.api.endpoint);
    const result = await chain('query')({
      inscription: [
        {
          where: {
            transaction: {
              hash: {
                _eq: this.hash,
              },
            },
          },
        },
        {
          id: true,
          current_owner: true,
        },
      ],
    });
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
      ['h', this.hash],
      ['dst', this.transferForm.value.basic.destination],
    ]);
    const urn = this.protocolService.buildURN(
      environment.chain.chainId,
      'transfer',
      params,
    );
    const modal = await this.modalCtrl.create({
      keyboardClose: true,
      backdropDismiss: false,
      component: TransactionFlowModalPage,
      componentProps: {
        urn,
        metadata: null,
        data: null,
        routerLink: ['/app/inscription', this.hash],
        resultCTA: 'View inscription',
        metaprotocol: 'inscription',
        metaprotocolAction: 'transfer',
      },
    });

    modal.present();
  }

  cancel() {
    this.modalCtrl.dismiss();
  }
}
