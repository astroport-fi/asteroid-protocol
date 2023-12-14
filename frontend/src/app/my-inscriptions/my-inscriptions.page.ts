import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';


@Component({
  selector: 'app-my-inscriptions',
  templateUrl: './my-inscriptions.page.html',
  styleUrls: ['./my-inscriptions.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class MyInscriptionsPage implements OnInit {

  constructor() {

  }

  ngOnInit() {
  }

}
