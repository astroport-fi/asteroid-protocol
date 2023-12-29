import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ModalController, ViewDidLeave } from '@ionic/angular';
import { WalletService } from '../core/service/wallet.service';
import { TransactionFlowModalPage } from '../transaction-flow-modal/transaction-flow-modal.page';
import { InscriptionMetadata, InscriptionService } from '../core/metaprotocol/inscription.service';
import { hashValue } from '../core/helpers/crypto';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-create-inscription',
  templateUrl: './create-inscription.page.html',
  styleUrls: ['./create-inscription.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule, RouterLink]
})
export class CreateInscriptionPage implements OnInit, ViewDidLeave {
  createForm: FormGroup;
  originalFilename: string = '';
  inscriptionFileSize: number = 0;
  maxFileSize = environment.limits.maxFileSize;
  renderImagePreview = false;
  contentRequired = false;

  constructor(private builder: FormBuilder, private protocolService: InscriptionService, private walletService: WalletService, private modalCtrl: ModalController) {
    this.createForm = this.builder.group({
      basic: this.builder.group({
        name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(32)]],
        description: '',
        contentUpload: [null, Validators.required]
      }),
    });
  }

  ngOnInit() {
  }

  ionViewDidLeave(): void {
    this.createForm.patchValue({
      basic: {
        name: '',
        description: '',
        contentUpload: null
      }
    });
  }

  submit() {
    this.contentRequired = false;
    if (this.createForm.valid) {
      this.createInscription();
    } else {
      this.createForm.markAllAsTouched();
      if (this.createForm.value.basic.contentUpload === null) {
        this.contentRequired = true;
      }
    }
  }

  async createInscription() {
    // The base64 data contains the mime type as well as the data itself
    // we need to strip the mime type from the data and store it in the metadata
    // Sample of the value "data:image/png;base64,iVBORw0Kbase64"
    let data = this.createForm.value.basic.contentUpload;
    const mime = data.split(";")[0].split(":")[1];
    data = data.split(",")[1];

    // Build the metadata for this inscription
    const metadata: InscriptionMetadata = {
      parent: {
        type: "/cosmos.bank.Account",
        identifier: (await this.walletService.getAccount()).address,
      },
      metadata: {
        name: this.createForm.value.basic.name.trim(),
        description: this.createForm.value.basic.description.trim(),
        mime,
      }
    };

    const metadataBase64 = btoa(JSON.stringify(metadata));
    const inscriptionHash = await hashValue(metadataBase64 + data);
    const params = new Map([
      ["h", inscriptionHash],
    ]);
    const urn = this.protocolService.buildURN(environment.chain.chainId, 'inscribe', params);

    const modal = await this.modalCtrl.create({
      component: TransactionFlowModalPage,
      componentProps: {
        urn,
        metadata: metadataBase64,
        data,
        routerLink: '/app/inscription'
      }
    });
    modal.present();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const base64 = e.target.result;


        this.renderImagePreview = false;
        const mime = base64.split(";")[0].split(":")[1];
        if (mime.startsWith("image/")) {
          this.renderImagePreview = true;
        }
        this.originalFilename = file.name;
        this.inscriptionFileSize = file.size;

        this.createForm.patchValue({
          basic: {
            contentUpload: base64
          }
        });
        this.contentRequired = false;
      };
      reader.readAsDataURL(file);
    }
  }

}
