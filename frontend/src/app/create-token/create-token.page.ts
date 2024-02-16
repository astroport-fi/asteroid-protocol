import { CommonModule, DatePipe } from '@angular/common';
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
import { MaskitoModule } from '@maskito/angular';
import { MaskitoElementPredicateAsync, MaskitoOptions } from '@maskito/core';
import { maskitoNumberOptionsGenerator } from '@maskito/kit';
import { environment } from 'src/environments/environment';
import { CFT20Service } from '../core/metaprotocol/cft20.service';
import { InscriptionMetadata } from '../core/metaprotocol/inscription.service';
import { StripSpacesPipe } from '../core/pipe/strip-spaces.pipe';
import { WalletService } from '../core/service/wallet.service';
import { TransactionFlowModalPage } from '../transaction-flow-modal/transaction-flow-modal.page';
import { WalletRequiredModalPage } from '../wallet-required-modal/wallet-required-modal.page';

@Component({
  selector: 'app-create-token',
  templateUrl: './create-token.page.html',
  styleUrls: ['./create-token.page.scss'],
  standalone: true,
  providers: [DatePipe],
  imports: [
    IonicModule,
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MaskitoModule,
  ],
})
export class CreateTokenPage implements OnInit, ViewDidLeave {
  createForm: FormGroup;
  precheckErrorText: string = '';
  minDate: Date;
  maxMintLimit: number = 0;
  limitNumeric: number = 0;
  maxFilesSize: number = environment.limits.maxFileSize;
  contentRequired: boolean = false;

  readonly numberMask: MaskitoOptions;
  readonly maxDecimalsMask: MaskitoOptions;

  readonly maskPredicate: MaskitoElementPredicateAsync = async (el) =>
    (el as HTMLIonInputElement).getInputElement();

  constructor(
    private builder: FormBuilder,
    private datePipe: DatePipe,
    private protocolService: CFT20Service,
    private walletService: WalletService,
    private modalCtrl: ModalController,
    private alertController: AlertController,
  ) {
    this.minDate = new Date();
    this.createForm = this.builder.group({
      basic: this.builder.group({
        name: [
          '',
          [
            Validators.required,
            Validators.minLength(1),
            Validators.maxLength(32),
            Validators.pattern('^[a-zA-Z0-9-. ]*$'),
          ],
        ],
        ticker: [
          '',
          [
            Validators.required,
            Validators.minLength(1),
            Validators.maxLength(10),
            Validators.pattern('^[a-zA-Z0-9-.]*$'),
          ],
        ],
        maxSupply: [
          1000000,
          [Validators.required, Validators.pattern('^[0-9. ]*$')],
        ],
        mintLimit: [
          1000,
          [Validators.required, Validators.pattern('^[0-9. ]*$')],
        ],
        decimals: [
          6,
          [Validators.required, Validators.min(0), Validators.max(6)],
        ],
        launchImmediately: 'true',
        launchDate: this.datePipe.transform(
          new Date(this.minDate),
          'yyyy-MM-ddTHH:mm:ss',
        ),
      }),
      optional: this.builder.group({
        imageUpload: null,
      }),
    });

    this.numberMask = maskitoNumberOptionsGenerator({
      decimalSeparator: '.',
      thousandSeparator: ' ',
      precision: 6,
      min: 1,
      max: 10000000000000.0,
    });

    this.maxDecimalsMask = maskitoNumberOptionsGenerator({
      min: 0,
      max: 6,
    });
  }

  ngOnInit() {
    this.minDate = new Date();
    this.createForm = this.builder.group({
      basic: this.builder.group({
        name: [
          '',
          [
            Validators.required,
            Validators.minLength(1),
            Validators.maxLength(32),
            Validators.pattern('^[a-zA-Z0-9-. ]*$'),
          ],
        ],
        ticker: [
          '',
          [
            Validators.required,
            Validators.minLength(1),
            Validators.maxLength(10),
            Validators.pattern('^[a-zA-Z0-9-.]*$'),
          ],
        ],
        maxSupply: [
          1000000,
          [Validators.required, Validators.pattern('^[0-9. ]*$')],
        ],
        mintLimit: [
          1000,
          [Validators.required, Validators.pattern('^[0-9. ]*$')],
        ],
        decimals: [
          6,
          [Validators.required, Validators.min(0), Validators.max(6)],
        ],
        launchImmediately: 'true',
        launchDate: this.datePipe.transform(
          new Date(this.minDate),
          'yyyy-MM-ddTHH:mm:ss',
        ),
      }),
      optional: this.builder.group({
        imageUpload: [null, [Validators.required]],
      }),
    });
  }

  ionViewDidLeave(): void {
    this.createForm.patchValue({
      basic: {
        name: '',
        ticker: '',
      },
      optional: {
        imageUpload: null,
      },
    });
  }

  submit() {
    if (this.createForm.valid) {
      this.createToken();
    } else {
      this.createForm.markAllAsTouched();
      if (this.createForm.value.optional.imageUpload === null) {
        this.contentRequired = true;
      }
    }
  }

  async createToken() {
    try {
      const name = encodeURI(this.createForm.value.basic.name.trim());
      const ticker = this.createForm.value.basic.ticker.replace(/\s/g, '');
      // const decimals = this.createForm.value.basic.decimals;
      const decimals = 6;
      const maxSupply = this.createForm.value.basic.maxSupply.replace(
        /\s/g,
        '',
      );
      const mintLimit = this.createForm.value.basic.mintLimit.replace(
        /\s/g,
        '',
      );

      // Construct metaprotocol memo message
      const params = new Map([
        ['nam', name],
        ['tic', ticker],
        ['sup', maxSupply],
        ['dec', decimals],
        ['lim', mintLimit],
        ['opn', Math.round(new Date().getTime() / 1000)],
      ]);
      if (this.createForm.value.basic.launchImmediately === 'false') {
        const launchDate = new Date(this.createForm.value.basic.launchDate);
        params.set('opn', launchDate.getTime() / 1000);
      }

      let data = this.createForm.value.optional.imageUpload;
      let sender = await this.walletService.getAccount();
      let metadataBase64 = null;
      if (data) {
        const mime = data.split(';')[0].split(':')[1];
        data = data.split(',')[1];

        // Build the metadata for this inscription
        const metadata: InscriptionMetadata = {
          parent: {
            type: '/cosmos.bank.Account',
            identifier: sender.address,
          },
          metadata: {
            name: 'Token Logo',
            description: 'Token Logo',
            mime,
          },
        };

        metadataBase64 = toBase64(toUtf8(JSON.stringify(metadata)));
      }

      const urn = this.protocolService.buildURN(
        environment.chain.chainId,
        'deploy',
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
          routerLink: ['/app/token', ticker],
          resultCTA: 'View token',
          metaprotocol: 'cft20',
          metaprotocolAction: 'deploy',
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

  onFileSelected(event: any) {
    this.precheckErrorText = '';
    this.contentRequired = false;
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const base64 = e.target.result;

        const mime = base64.split(';')[0].split(':')[1];
        if (!mime.startsWith('image/')) {
          this.precheckErrorText =
            'Only image files are allowed for token logos';
          return;
        }
        if (file.size > environment.limits.maxFileSize) {
          this.precheckErrorText = `File size exceeds maximum allowed size of ${environment.limits.maxFileSize / 1000} kb`;
          return;
        }

        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          const height = img.naturalHeight;
          const width = img.naturalWidth;

          if (width != height) {
            this.precheckErrorText = 'Image must be square';
            return;
          }

          if (width < 250 || width > 1024) {
            this.precheckErrorText =
              'Image must be square and between 250x250 and 1024x1024 pixels';
            return;
          }

          this.createForm.patchValue({
            optional: {
              imageUpload: base64,
            },
          });
          this.contentRequired = false;
        };
      };
      reader.readAsDataURL(file);
    }
  }

  supplyChanged(event: any) {
    // The amount of tokens that can be minter per tx may not exceed 1% of the total supply
    this.maxMintLimit =
      StripSpacesPipe.prototype.transform(event.detail.value) * 0.01;
  }

  limitChanged(event: any) {
    this.limitNumeric = StripSpacesPipe.prototype.transform(event.detail.value);
  }
}
