import { Pipe, PipeTransform } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { api } from '../helpers/api';
import { delay } from '../helpers/delay';

interface StargazeResponse {
  data: string;
}

@Pipe({
  name: 'shortenAddressHidden',
  standalone: true,
})
// Check if this is shortened, if so, hide it
export class ShortenAddressHiddenPipe implements PipeTransform {
  transform(value: string | null): string {
    if (!value) {
      return '';
    }
    if (value.includes('...')) {
      return '';
    }
    return value;
  }
}
