import { Pipe, PipeTransform } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { api } from '../helpers/api';
import { delay } from '../helpers/delay';

interface StargazeResponse {
  data: string;
}

@Pipe({
  name: 'shortenAddress',
  standalone: true,
})
export class ShortenAddressPipe implements PipeTransform {
  transform(
    value: string,
    startLength: number = 10,
    endLength: number = 6,
  ): Observable<string> {
    if (!value) {
      return new Observable((observer) => {
        observer.next(value);
        observer.complete();
      });
    }
    if (value.length <= startLength + endLength) {
      return new Observable((observer) => {
        observer.next(value);
        observer.complete();
      });
    }

    // Here we return the shortened address immediately and then query
    // Stargaze for the name. If the name is found, we will update the
    // shortened address with the name
    return new Observable((observer) => {
      const start = value.substring(0, startLength);
      const end = value.substring(value.length - endLength);
      observer.next(`${start}...${end}`);

      const query = {
        name: { address: value },
      };
      const queryBase64 = btoa(JSON.stringify(query));

      api<StargazeResponse>(
        `${environment.api.stargazeNameEndpoint}${queryBase64}`,
      )
        .then((response) => {
          if (response.data) {
            observer.next(`${response.data}.cosmos`);
          }
          observer.complete();
        })
        .catch((error) => {
          console.debug('No stargaze name for address', value);
          observer.complete();
        });
    });
  }
}
