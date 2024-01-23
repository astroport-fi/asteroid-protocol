import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { HumanTypePipe } from '../core/pipe/human-type.pipe';

@Component({
  selector: 'app-generic-preview',
  templateUrl: './generic-preview.page.html',
  styleUrls: ['./generic-preview.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HumanTypePipe]
})
export class GenericPreviewPage implements OnInit {


  @Input() mime: string = 'text/plain';
  @Input() contentPath: string = '';
  @Input() isExplicit: boolean = false;

  humanType: string = '';

  constructor() {
  }

  ngOnInit() {
    this.humanType = HumanTypePipe.prototype.transform(this.mime);
  }


}
