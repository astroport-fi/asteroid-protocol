import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { MaskitoElementPredicateAsync, MaskitoOptions } from '@maskito/core';
import { MaskitoModule } from '@maskito/angular';
import { maskitoNumberOptionsGenerator } from '@maskito/kit';
import { formatDate } from '../core/helpers/delay';
import { CFT20Service } from '../core/metaprotocol/cft20.service';
import { WalletService } from '../core/service/wallet.service';
import { TransactionFlowModalPage } from '../transaction-flow-modal/transaction-flow-modal.page';

@Component({
  selector: 'app-create-token',
  templateUrl: './create-token.page.html',
  styleUrls: ['./create-token.page.scss'],
  standalone: true,
  providers: [DatePipe],
  imports: [IonicModule, CommonModule, ReactiveFormsModule, RouterLink, MaskitoModule],
})
export class CreateTokenPage implements OnInit {
  createForm: FormGroup;

  minDate: Date;

  readonly numberMask: MaskitoOptions;
  readonly maxDecimalsMask: MaskitoOptions;

  readonly maskPredicate: MaskitoElementPredicateAsync = async (el) => (el as HTMLIonInputElement).getInputElement();

  constructor(private builder: FormBuilder, private datePipe: DatePipe, private protocolService: CFT20Service, private walletService: WalletService, private modalCtrl: ModalController) {
    this.minDate = new Date();
    this.createForm = this.builder.group({
      basic: this.builder.group({
        name: ['Tokeeey', Validators.required],
        ticker: ['TOKEY', [Validators.required, Validators.minLength(3), Validators.maxLength(5)]],
        maxSupply: [1000000, [Validators.required, Validators.pattern("^[0-9 ]*$")]],
        mintLimit: [1000, [Validators.required, Validators.pattern("^[0-9 ]*$")]],
        decimals: [6, [Validators.required, Validators.pattern("^[0-9]*$")]],
        launchImmediately: 'true',
        launchDate: this.datePipe.transform(new Date(this.minDate), 'yyyy-MM-ddTHH:mm:ss'),
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

    const modal = this.modalCtrl.create({
      component: TransactionFlowModalPage,
    }).then(modal => modal.present());


  }



  ngOnInit() {

  }

  submit() {
    if (this.createForm.valid) {
      this.createToken();
    } else {
      this.createForm.markAllAsTouched();
    }
  }

  async createToken() {
    console.log(this.createForm.get('optional.imageUpload')?.value);

    const name = this.createForm.value.basic.name.trim();
    const ticker = this.createForm.value.basic.ticker.replace(/\s/g, '');
    const decimals = this.createForm.value.basic.decimals;
    const maxSupply = this.createForm.value.basic.maxSupply.replace(/\s/g, '');
    const mintLimit = this.createForm.value.basic.mintLimit.replace(/\s/g, '');

    // TODO Construct metaprotocol memo message
    const params = new Map([
      ["nam", name],
      ["tic", ticker],
      ["sup", maxSupply],
      ["dec", decimals],
      ["lim", mintLimit],
    ]);
    if (this.createForm.value.basic.launchImmediately === 'false') {
      const launchDate = new Date(this.createForm.value.basic.launchDate);
      params.set("opn", Math.round(launchDate.getTime() / 1000).toString());
    }
    const urn = this.protocolService.buildURN('cosmoshub-4', 'deploy', params);
    console.log(urn);

    // const signed = await this.walletService.sign(urn, null, null);
    // console.log(signed);

    const modal = await this.modalCtrl.create({
      component: TransactionFlowModalPage,
    });
    modal.present();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const base64Image = e.target.result;
        this.createForm.patchValue({
          optional: {
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