import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
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
  isSigning = false;

  // Hold the form for persistance
  createForm: FormGroup;

  constructor(private builder: FormBuilder, private walletService: WalletService) {
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

    this.isSigning = true;
    await delay(1000);
    console.log("one");

    await delay(1000);
    console.log("tweo");

    await delay(1000);
    console.log("three");


    // TODO: Popup, check keplr popup to sign the inscription transaction

    this.isSigning = false;

    // const signedTx = await this.walletService.sign("inscriptions.v1.content.generic", JSON.stringify(metadata), JSON.stringify(data));
    // console.log(signedTx);

    // const result = await this.walletService.broadcast(signedTx);
    // console.log(result);
  }

}
