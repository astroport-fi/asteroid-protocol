import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { InscriptionOperations, TxData } from '@asteroid-protocol/sdk';
import { IonicModule, ModalController } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { splitDataUrl } from '../core/helpers/string';
import { WalletService } from '../core/service/wallet.service';
import { TransactionModalV2Component } from '../transaction-modal-v2/transaction-modal-v2.component';

@Component({
  selector: 'app-create-collection',
  templateUrl: './create-collection.component.html',
  styleUrl: './create-collection.component.scss',
  standalone: true,
  imports: [IonicModule, ReactiveFormsModule],
})
export class CreateCollectionPage implements OnInit {
  createInscriptionForm = this.builder.nonNullable.group({
    basic: this.builder.nonNullable.group({
      symbol: [
        '',
        [
          Validators.required,
          Validators.minLength(1),
          Validators.maxLength(10),
          Validators.pattern('^[a-zA-Z0-9-.]*$'),
        ],
      ],
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
  originalFilename: string = '';
  inscriptionFileSize: number = 0;
  maxFileSize = environment.limits.maxFileSize;
  renderImagePreview = false;
  contentRequired = false;

  constructor(
    private builder: FormBuilder,
    private modalCtrl: ModalController,
    private walletService: WalletService,
  ) {}

  ngOnInit() {}

  submit() {
    this.contentRequired = false;
    if (this.createInscriptionForm.valid) {
      this.createCollection();
    } else {
      this.createInscriptionForm.markAllAsTouched();
      if (this.createInscriptionForm.value.basic?.contentUpload === null) {
        this.contentRequired = true;
      }
    }
  }

  async createCollection() {
    const formData = this.createInscriptionForm.value.basic;
    if (!formData) {
      console.warn('invalid form data');
      return;
    }

    const [mime, data] = splitDataUrl(formData.contentUpload!);
    const name = formData.name?.trim();
    const description = formData.description?.trim();
    const symbol = formData.symbol?.trim();

    if (!symbol || !name || !description) {
      console.warn('name or description');
      return;
    }

    const address = await this.walletService.getAddress();
    const operations = new InscriptionOperations(
      environment.chain.chainId,
      address,
    );
    const txData: TxData = operations.inscribeCollection(data, {
      symbol,
      mime,
      name,
      description,
    });

    // @todo handle connect wallet
    const modal = await this.modalCtrl.create({
      keyboardClose: true,
      backdropDismiss: false,
      component: TransactionModalV2Component,
      componentProps: {
        txData,
        routerLink: ['/app/collection', symbol],
        resultCTA: 'View collection',
      },
    });
    modal.present();
  }

  onInscriptionFileSelected(event: Event) {
    this.contentRequired = false;
    const input = event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }

    const file = input.files[0];
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
