import { Component, OnInit } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-content',
  templateUrl: './content.component.html',
  styleUrl: './content.component.scss',
  standalone: true,
  imports: [IonContent],
})
export class ContentComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
