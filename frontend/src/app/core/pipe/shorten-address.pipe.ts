import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'shortenAddress',
    standalone: true
})
export class ShortenAddressPipe implements PipeTransform {

    transform(value: string, startLength: number = 10, endLength: number = 6): string {
        if (!value) {
            return '';
        }
        if (value.length <= startLength + endLength) {
            return value;
        }
        const start = value.substring(0, startLength);
        const end = value.substring(value.length - endLength);
        return `${start}...${end}`;
    }

}
