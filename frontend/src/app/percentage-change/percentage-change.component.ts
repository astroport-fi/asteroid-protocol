import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-percentage-change',
  templateUrl: './percentage-change.component.html',
  styleUrls: ['./percentage-change.component.scss'],
  standalone: true,
  imports: [IonicModule],
})
export class PercentageChangeComponent implements OnInit, OnChanges {
  @Input() value!: number;
  @Input() baseValue!: number;
  @Input() title = '';
  change!: number;

  ngOnInit() {
    this.calculateChange();
  }

  calculateChange() {
    this.change = ((this.value - this.baseValue) / this.baseValue) * 100;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('baseValue' in changes) {
      this.baseValue = changes['baseValue'].currentValue;
    }

    if ('value' in changes) {
      this.value = changes['value'].currentValue;
    }

    this.calculateChange();
  }
}
