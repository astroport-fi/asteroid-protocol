import { DecimalPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { InfiniteScrollCustomEvent, IonicModule } from '@ionic/angular';
import { DateAgoPipe } from '../core/pipe/date-ago.pipe';
import { HumanTypePipe } from '../core/pipe/human-type.pipe';
import { AsteroidService, Collection } from '../core/service/asteroid.service';
import { GenericPreviewPage } from '../generic-preview/generic-preview.page';

@Component({
  selector: 'app-list-collections',
  templateUrl: './list-collections.component.html',
  styleUrl: './list-collections.component.scss',
  standalone: true,
  imports: [
    IonicModule,
    RouterModule,
    DateAgoPipe,
    HumanTypePipe,
    DecimalPipe,
    GenericPreviewPage,
  ],
})
export class ListCollectionsPage implements OnInit {
  collections: Collection[] = [];
  isLoading = true;
  offset = 0;
  limit = 50;
  lastFetchCount = this.limit;

  constructor(private asteroidService: AsteroidService) {}

  async ngOnInit() {
    this.collections = await this.asteroidService.getCollections(
      this.offset,
      this.limit,
    );
    this.isLoading = false;
  }

  async onIonInfinite(event: InfiniteScrollCustomEvent) {
    if (this.lastFetchCount < this.limit) {
      await event.target.complete();
      return;
    }
    this.offset += this.limit;
    const collections = await this.asteroidService.getCollections(
      this.offset,
      this.limit,
    );
    this.collections.push(...collections);
    this.lastFetchCount = collections.length;
    await event.target.complete();
  }
}
