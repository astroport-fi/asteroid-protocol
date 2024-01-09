import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'humanSupply', standalone: true })
export class HumanSupplyPipe implements PipeTransform {
    transform(value: number) {
        if (value >= 1000000) {
            return (value / 1000000).toFixed(4) + ' M';
        } else if (value >= 1000) {
            return (value / 1000).toFixed(6) + 'k';
        } else {
            return value.toString();
        }
    }
}