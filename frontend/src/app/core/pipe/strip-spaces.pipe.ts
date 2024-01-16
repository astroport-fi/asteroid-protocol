import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'stripSpaces', standalone: true })
export class StripSpacesPipe implements PipeTransform {
    transform(value: string): number {
        return parseFloat(value.toString().replace(/\s/g, ''));
    }
}