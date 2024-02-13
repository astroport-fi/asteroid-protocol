import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'shortenAddressMin',
  standalone: true,
})
export class ShortenAddressMinPipe implements PipeTransform {
  transform(value: string, start = 6, len = 6): string {
    return value.substring(start, start + len);
  }
}
