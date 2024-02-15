import { Component, Input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ShortenAddressPipe } from '../core/pipe/shorten-address.pipe';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-user-chip',
  templateUrl: './user-chip.component.html',
  styleUrl: './user-chip.component.scss',
  standalone: true,
  imports: [RouterModule, IonicModule, ShortenAddressPipe, AsyncPipe],
})
export class UserChipComponent implements OnInit {
  @Input({ required: true }) currentAddress!: string;
  @Input({ required: true }) userAddress!: string;
  @Input() section = 'inscriptions';

  constructor() {}

  ngOnInit() {}
}
