import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-create-content',
  templateUrl: './create-content.page.html',
  styleUrls: ['./create-content.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterLink]
})
export class CreateContentPage implements OnInit {

  constructor() {

  }

  ngOnInit() {
  }

}
