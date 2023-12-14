import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';


@Component({
  selector: 'app-my-tokens',
  templateUrl: './my-tokens.page.html',
  styleUrls: ['./my-tokens.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class MyTokensPage implements OnInit {

  constructor() {

  }

  ngOnInit() {
  }

}
