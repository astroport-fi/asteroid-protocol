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
import { LottieComponent } from 'ngx-lottie';
import { StripSpacesPipe } from '../core/pipe/strip-spaces.pipe';

@Component({
  selector: 'app-wallet-required-modal',
  templateUrl: './wallet-required-modal.page.html',
  styleUrls: ['./wallet-required-modal.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    ReactiveFormsModule,
    CommonModule,
    FormsModule,
    RouterLink,
  ],
})
export class WalletRequiredModalPage implements OnInit {
  constructor(private modalCtrl: ModalController) {}

  async ngOnInit() {}

  cancel() {
    this.modalCtrl.dismiss();
  }
}
