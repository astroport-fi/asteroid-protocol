import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AlertController, LoadingController, IonicModule } from '@ionic/angular';
import { WalletService } from '../core/service/wallet.service';
import { delay } from '../core/helpers/delay';

@Component({
  selector: 'app-create-inscription',
  templateUrl: './create-inscription.page.html',
  styleUrls: ['./create-inscription.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule, RouterLink]
})
export class CreateInscriptionPage implements OnInit {
  isError = false;

  // Hold the form for persistance
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
    console.log("Inscribe");

    // TODO: Validate form
    const metadata = {

    };

    const data = {};

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

    // this.isSigning = true;
    // await delay(1000);
    // console.log("one");

    // await delay(1000);
    // console.log("tweo");

    // await delay(1000);
    // console.log("three");


    // TODO: Popup, check keplr popup to sign the inscription transaction

    // this.isSigning = false;

    try {
      const signedTx = await this.walletService.sign("inscriptions.v1.content.generic", JSON.stringify(metadata), JSON.stringify(data));

      await alert.dismiss();

      const loading = await this.loadingCtrl.create({
        message: 'Waiting for the Hub to accept your inscription...',
      });

      loading.present();

      // const broadcast = await this.alertController.create({
      //   header: "Inscribing",
      //   message: "Inscribing your content on the Hub. Please wait...",
      //   translucent: true,
      //   keyboardClose: true,
      //   backdropDismiss: false,
      //   buttons: [],
      // });

      // this.isError = false;
      // await broadcast.present();

      const result = await this.walletService.broadcast(signedTx);

      await loading.dismiss();
      this.router.navigate(["/app/inscription", result]);

    } catch (error) {
      this.isError = true;
      await alert.dismiss();
    }
  }

}
