import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
} from '@angular/core';
import type { OnInit } from '@angular/core';
import {
  IonSearchbar,
  IonicModule,
  SearchbarCustomEvent,
} from '@ionic/angular';
import {
  AsteroidService,
  ScalarDefinition,
} from '../core/service/asteroid.service';
import {
  GraphQLTypes,
  InputType,
  Selector,
  ValueTypes,
  order_by,
} from '../core/types/zeus';
import { TokenDecimalsPipe } from '../core/pipe/token-with-decimals.pipe';
import { CommonModule } from '@angular/common';

const tokenSelector = Selector('token')({
  id: true,
  name: true,
  ticker: true,
  content_path: true,
  last_price_base: true,
  decimals: true,
});

type Token = InputType<
  GraphQLTypes['token'],
  typeof tokenSelector,
  ScalarDefinition
>;

@Component({
  selector: 'app-token-modal',
  templateUrl: 'token-modal.component.html',
  standalone: true,
  imports: [CommonModule, IonicModule, TokenDecimalsPipe],
  styleUrl: './token-modal.component.scss',
})
export class TokenModalComponent implements OnInit {
  @ViewChild('search') search!: IonSearchbar;

  @Output() selectionChange = new EventEmitter<Token>();

  isLoading = true;
  tokens: Token[] = [];
  filteredItems: Token[] = [];

  constructor(private asteroidService: AsteroidService) {}

  async ngOnInit() {
    this.tokens = await this.getTokens('');
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
    this.filteredItems = await this.getTokens(ev.target.value);
    this.isLoading = false;
  }

  handleChange(token: Token) {
    this.selectionChange.emit(token);
  }

  async getTokens(search?: string | null, offset = 0, limit = 20) {
    let where: ValueTypes['token_bool_exp'] | undefined = undefined;
    if (search) {
      where = {
        _or: [
          { name: { _like: `%${search}%` } },
          { name: { _like: `%${search.toUpperCase()}%` } },
          { ticker: { _like: `%${search}%` } },
          { ticker: { _like: `%${search.toUpperCase()}%` } },
        ],
      };
    }

    const tokensResult = await this.asteroidService.query({
      token: [
        {
          offset,
          limit,
          order_by: [{ id: order_by.asc }],
          where,
        },
        tokenSelector,
      ],
    });
    return tokensResult.token;
  }
}
