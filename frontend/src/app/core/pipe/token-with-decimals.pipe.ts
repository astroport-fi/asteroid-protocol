import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'tokenDecimals', standalone: true })
export class TokenDecimalsPipe implements PipeTransform {
  transform(value: number, decimals: number) {
    return value / Math.pow(10, decimals);
  }
}
