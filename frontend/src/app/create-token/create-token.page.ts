import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MaskitoElementPredicateAsync, MaskitoOptions } from '@maskito/core';
import { MaskitoModule } from '@maskito/angular';
import { maskitoNumberOptionsGenerator } from '@maskito/kit';

@Component({
  selector: 'app-create-token',
  templateUrl: './create-token.page.html',
  styleUrls: ['./create-token.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule, RouterLink, MaskitoModule],
})
export class CreateTokenPage implements OnInit {
  createForm: FormGroup;

  readonly numberMask: MaskitoOptions;
  readonly maxDecimalsMask: MaskitoOptions;

  readonly maskPredicate: MaskitoElementPredicateAsync = async (el) => (el as HTMLIonInputElement).getInputElement();

  constructor(private builder: FormBuilder) {
    this.createForm = this.builder.group({
      basic: this.builder.group({
        name: "",
        ticker: "",
        maxSupply: 0,
        mintLimit: 0,
        decimals: 6,
        openMint: true
      }),
      optional: this.builder.group({
        imageUpload: null
      }),
    });

    this.numberMask = maskitoNumberOptionsGenerator({
      decimalSeparator: '.',
      thousandSeparator: ' ',
      precision: this.createForm.get('basic.decimals')?.value,
      min: 1,
    });

    this.maxDecimalsMask = maskitoNumberOptionsGenerator({
      min: 0,
      max: 18,
    });

  }

  ngOnInit() {
  }

}