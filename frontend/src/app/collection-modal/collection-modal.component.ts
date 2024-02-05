import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {
  GraphQLTypes,
  InputType,
  ScalarDefinition,
  Selector,
  ValueTypes,
  order_by,
} from '@asteroid-protocol/sdk';
import {
  IonSearchbar,
  IonicModule,
  SearchbarCustomEvent,
} from '@ionic/angular';
import { ContentComponent } from '../content/content.component';
import { AsteroidService } from '../core/service/asteroid.service';
import { WalletService } from '../core/service/wallet.service';

const collectionSelector = Selector('collection')({
  id: true,
  name: true,
  content_path: true,
});

export type Collection = InputType<
  GraphQLTypes['collection'],
  typeof collectionSelector,
  ScalarDefinition
>;

@Component({
  selector: 'app-collection-modal',
  templateUrl: './collection-modal.component.html',
  styleUrl: './collection-modal.component.scss',
  standalone: true,
  imports: [IonicModule, ContentComponent],
})
export class CollectionModalComponent implements OnInit {
  @ViewChild('search') search!: IonSearchbar;
  @Output() selectionChange = new EventEmitter<Collection>();

  isLoading = true;
  collections: Collection[] = [];
  filteredItems: Collection[] = [];
  address = '';

  constructor(
    private asteroidService: AsteroidService,
    private walletService: WalletService,
  ) {}

  async ngOnInit() {
    this.address = await this.walletService.getAddress();
    this.collections = await this.getCollections();
    this.filteredItems = [...this.collections];
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
      this.filteredItems = await this.getCollections(value);
    } else {
      this.filteredItems = [...this.collections];
    }
    this.isLoading = false;
  }

  handleChange(collection: Collection) {
    this.selectionChange.emit(collection);
  }

  async getCollections(search?: string | null, offset = 0, limit = 20) {
    let where: ValueTypes['collection_bool_exp'] = {
      creator: {
        _eq: this.address,
      },
    };
    if (search) {
      where._and = [
        {
          _or: [
            { name: { _like: `%${search}%` } },
            { name: { _like: `%${search.toUpperCase()}%` } },
            { symbol: { _like: `%${search}%` } },
            { symbol: { _like: `%${search.toUpperCase()}%` } },
          ],
        },
      ];
    }

    const collectionsResult = await this.asteroidService.query({
      collection: [
        {
          offset,
          limit,
          order_by: [{ id: order_by.asc }],
          where,
        },
        collectionSelector,
      ],
    });
    return collectionsResult.collection;
  }
}
