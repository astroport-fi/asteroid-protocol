import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { LottieComponent } from 'ngx-lottie';

@Component({
  selector: 'app-wallet-empty',
  templateUrl: './wallet-empty.component.html',
  styleUrl: './wallet-empty.component.scss',
  standalone: true,
  imports: [IonicModule, LottieComponent],
})
export class WalletEmptyComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
