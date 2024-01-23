import { Component, Input, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { LottieComponent } from 'ngx-lottie';

import { StripSpacesPipe } from '../core/pipe/strip-spaces.pipe';

@Component({
  selector: 'app-marketplace-notice-modal',
  templateUrl: './marketplace-notice-modal.page.html',
  styleUrls: ['./marketplace-notice-modal.page.scss'],
  standalone: true,
  imports: [IonicModule, ReactiveFormsModule, CommonModule, FormsModule, RouterLink]
})
export class MarketplaceNoticeModalPage implements OnInit {

  constructor(private modalCtrl: ModalController) {

  }

  async ngOnInit() {

  }

  closeAndHide() {
    localStorage.setItem('marketplace-notice', 'shown');

    this.modalCtrl.dismiss();
  }

}
