import { Pipe, PipeTransform } from '@angular/core';
import mime from 'mime';

@Pipe({ name: 'mimeType', standalone: true })
export class MimeTypePipe implements PipeTransform {
    transform(value: string) {
        return mime.getType(value)
    }
}