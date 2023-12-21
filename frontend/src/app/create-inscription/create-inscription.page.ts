import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AlertController, LoadingController, IonicModule } from '@ionic/angular';
import { WalletService } from '../core/service/wallet.service';
import { environment } from 'src/environments/environment';
import { Parent } from '../core/types/metadata/parent';
import { ContentInscription } from '../core/types/metadata/content-inscription';
import { hashValue } from '../core/helpers/crypto';

type InscriptionMetadata = {
  parent: Parent;
  metadata: ContentInscription;
}

@Component({
  selector: 'app-create-inscription',
  templateUrl: './create-inscription.page.html',
  styleUrls: ['./create-inscription.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule, RouterLink]
})
export class CreateInscriptionPage implements OnInit {
  isError = false;
  errorText = "";
  createForm: FormGroup;

  constructor(private builder: FormBuilder,
    private walletService: WalletService,
    private alertController: AlertController,
    private router: Router,
    private loadingCtrl: LoadingController,
  ) {
    this.createForm = this.builder.group({
      basic: this.builder.group({
        name: "",
        description: "",
        imageUpload: null,
      }),
    });
  }

  ngOnInit() {
  }

  async inscribe() {

    // The base64 data contains the mime type as well as the data itself
    // we need to strip the mime type from the data and store it in the metadata
    // Sample of the value "data:image/png;base64,iVBORw0Kbase64"
    let data = this.createForm.value.basic.imageUpload;
    const mime = data.split(";")[0].split(":")[1];
    data = data.split(",")[1];

    // Build the metadata for this inscription
    const metadata: InscriptionMetadata = {
      parent: {
        type: "/cosmos.bank.Account",
        identifier: (await this.walletService.getAccount()).address,
      },
      metadata: {
        name: this.createForm.value.basic.name,
        description: this.createForm.value.basic.description,
        mime,
      }
    };
    const metadataBase64 = btoa(JSON.stringify(metadata));
    const inscriptionHash = await hashValue(metadataBase64 + data);

    // URN for a content inscription follows the structure
    // urn:inscription:chainId=content@hash
    // where hash is SHA-256(base64 encoded JSON metadata + base64 encoded data)
    // Example: urn:inscription:gaialocal-1@v1=content@76189406df1f72cd2e55b9246ec9944d338432154fc5cfc105bf87d1e595730b
    const urn = `urn:inscription:${environment.chain.chainId}=content@${inscriptionHash}`

    // TODO: Add fee/gas information to alert/modal/popup
    const alert = await this.alertController.create({
      header: "Inscribe",
      subHeader: "Sign the inscription transaction",
      message: "Your wallet will be opened shortly requesting you to sign the inscription transaction. Please note that some hardware wallets might not be able to sign these types of transactions",
      keyboardClose: true,
      backdropDismiss: false,
      buttons: [],
    });

    this.isError = false;
    await alert.present();


    try {
      // Sign the inscription transaction
      const signedTx = await this.walletService.sign(urn, metadataBase64, data);
      await alert.dismiss();

      const loading = await this.loadingCtrl.create({
        message: 'Waiting for the Hub to accept your inscription...',
      });

      loading.present();

      const result = await this.walletService.broadcast(signedTx);
      await loading.dismiss();

      // Redirect to the view page
      this.router.navigate(["/app/inscription", result]);

    } catch (error: any) {
      this.isError = true;

      if (error instanceof Error) {
        this.errorText = error.message;
      }
      await alert.dismiss();
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const base64Image = e.target.result;
        this.createForm.patchValue({
          basic: {
            imageUpload: base64Image
          }
        });

        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          const height = img.naturalHeight;
          const width = img.naturalWidth;
          console.log('Width and Height', width, height);
        };
      };
      reader.readAsDataURL(file);
    }
  }

}
