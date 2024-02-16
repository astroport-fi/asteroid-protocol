import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { toBase64, toUtf8 } from '@cosmjs/encoding';
import {
  AlertController,
  IonicModule,
  ModalController,
  ViewDidLeave,
} from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { hashValue } from '../core/helpers/crypto';
import {
  InscriptionMetadata,
  InscriptionService,
} from '../core/metaprotocol/inscription.service';
import { WalletService } from '../core/service/wallet.service';
import { TransactionFlowModalPage } from '../transaction-flow-modal/transaction-flow-modal.page';
import { WalletRequiredModalPage } from '../wallet-required-modal/wallet-required-modal.page';

@Component({
  selector: 'app-create-inscription',
  templateUrl: './create-inscription.page.html',
  styleUrls: ['./create-inscription.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule, RouterLink],
})
export class CreateInscriptionPage implements OnInit, ViewDidLeave {
  createInscriptionForm: FormGroup;
  originalFilename: string = '';
  inscriptionFileSize: number = 0;
  maxFileSize = environment.limits.maxFileSize;
  renderImagePreview = false;
  contentRequired = false;

  constructor(
    private builder: FormBuilder,
    private protocolService: InscriptionService,
    private walletService: WalletService,
    private modalCtrl: ModalController,
    private alertController: AlertController,
  ) {
    this.createInscriptionForm = this.builder.group({
      basic: this.builder.group({
        name: [
          '',
          [
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(32),
          ],
        ],
        description: '',
        contentUpload: [null, Validators.required],
      }),
    });
  }

  ngOnInit() {}

  ionViewDidLeave(): void {
    this.createInscriptionForm.patchValue({
      basic: {
        name: '',
        description: '',
        contentUpload: null,
      },
    });
  }

  submit() {
    this.contentRequired = false;
    if (this.createInscriptionForm.valid) {
      this.createInscription();
    } else {
      this.createInscriptionForm.markAllAsTouched();
      if (this.createInscriptionForm.value.basic.contentUpload === null) {
        this.contentRequired = true;
      }
    }
  }

  async createInscription() {
    // The base64 data contains the mime type as well as the data itself
    // we need to strip the mime type from the data and store it in the metadata
    // Sample of the value "data:image/png;base64,iVBORw0Kbase64"
    let data = this.createInscriptionForm.value.basic.contentUpload;
    const mime = data.split(';')[0].split(':')[1];
    data = data.split(',')[1];

    try {
      // Build the metadata for this inscription
      const metadata: InscriptionMetadata = {
        parent: {
          type: '/cosmos.bank.Account',
          identifier: (await this.walletService.getAccount()).address,
        },
        metadata: {
          name: this.createInscriptionForm.value.basic.name.trim(),
          description:
            this.createInscriptionForm.value.basic.description.trim(),
          mime,
        },
      };

      const metadataBase64 = toBase64(toUtf8(JSON.stringify(metadata)));
      const inscriptionHash = await hashValue(metadataBase64 + data);
      const params = new Map([['h', inscriptionHash]]);
      const urn = this.protocolService.buildURN(
        environment.chain.chainId,
        'inscribe',
        params,
      );

      const modal = await this.modalCtrl.create({
        keyboardClose: true,
        backdropDismiss: false,
        component: TransactionFlowModalPage,
        componentProps: {
          urn,
          metadata: metadataBase64,
          data,
          routerLink: '/app/inscription',
          resultCTA: 'View inscription',
        },
      });
      modal.present();
    } catch (err) {
      // Popup explaining that Keplr is needed and needs to be installed first
      const modal = await this.modalCtrl.create({
        keyboardClose: true,
        backdropDismiss: true,
        component: WalletRequiredModalPage,
        cssClass: 'wallet-required-modal',
      });
      modal.present();
    }
  }

  onInscriptionFileSelected(event: any) {
    this.contentRequired = false;
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const base64 = e.target.result;

        this.renderImagePreview = false;
        const mime = base64.split(';')[0].split(':')[1];
        if (mime.startsWith('image/')) {
          this.renderImagePreview = true;
        }
        this.originalFilename = file.name;
        this.inscriptionFileSize = file.size;

        this.createInscriptionForm.patchValue({
          basic: {
            contentUpload: base64,
          },
        });
        this.contentRequired = false;
      };
      reader.readAsDataURL(file);
    }
  }
}
