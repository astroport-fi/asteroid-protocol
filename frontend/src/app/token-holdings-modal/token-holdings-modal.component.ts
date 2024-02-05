import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {
  IonSearchbar,
  IonicModule,
  SearchbarCustomEvent,
} from '@ionic/angular';
import { ContentComponent } from '../content/content.component';
import { TokenDecimalsPipe } from '../core/pipe/token-with-decimals.pipe';
import {
  AsteroidService,
  TokenHolding,
} from '../core/service/asteroid.service';
import { WalletService } from '../core/service/wallet.service';

@Component({
  selector: 'app-token-holdings-modal',
  templateUrl: './token-holdings-modal.component.html',
  styleUrl: './token-holdings-modal.component.scss',
  standalone: true,
  imports: [CommonModule, IonicModule, TokenDecimalsPipe, ContentComponent],
})
export class TokenHoldingsModalComponent implements OnInit {
  @ViewChild('search') search!: IonSearchbar;

  @Input({ required: true }) baseTokenUSD!: number;
  @Output() selectionChange = new EventEmitter<TokenHolding>();

  isLoading = true;
  tokens: TokenHolding[] = [];
  filteredItems: TokenHolding[] = [];
  address = '';

  constructor(
    private asteroidService: AsteroidService,
    private walletService: WalletService,
  ) {}

  async ngOnInit() {
    this.address = await this.walletService.getAddress();
    this.tokens = await this.asteroidService.getTokenHoldings(this.address);
    this.filteredItems = [...this.tokens];
    this.isLoading = false;
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.search.setFocus();
    }, 150);
  }

  async searchbarInput(ev: SearchbarCustomEvent) {
    this.isLoading = true;
    const value = ev.target.value;
    if (value) {
      this.filteredItems = await this.asteroidService.getTokenHoldings(
        this.address,
        value,
      );
    } else {
      this.filteredItems = [...this.tokens];
    }
    this.isLoading = false;
  }

  handleChange(token: TokenHolding) {
    this.selectionChange.emit(token);
  }
}
