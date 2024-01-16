import { Pipe, PipeTransform } from '@angular/core';
import { Observable } from 'rxjs';
import { delay } from '../helpers/delay';
import { api } from '../helpers/api';
import { environment } from 'src/environments/environment';

interface StargazeResponse {
    data: string
}

@Pipe({
    name: 'shortenAddressHidden',
    standalone: true
})
// Check if this is shortened, if so, hide it
export class ShortenAddressHiddenPipe implements PipeTransform {

    transform(value: string | null): string {
        if (!value) {
            return "";
        }
        if (value.includes("...")) {
            return "";
        }
        return value;
    }

}
