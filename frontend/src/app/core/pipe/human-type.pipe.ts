import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'humanType', standalone: true })
export class HumanTypePipe implements PipeTransform {
    transform(value: string) {
        switch (value) {
            case 'image/png':
            case 'image/jpeg':
            case 'image/gif':
                return 'Image'
            case 'video/mp4':
                return 'Video'
            case 'audio/mpeg':
                return 'Audio'
            case 'audio/wav':
                return 'Audio'
            case 'text/markdown':
                return 'Markdown'
            case 'application/pdf':
                return 'PDF'
            case 'application/zip':
                return 'ZIP'
            case 'application/x-tar':
                return 'TAR'
            case 'application/x-rar-compressed':
                return 'RAR'
            case 'application/x-7z-compressed':
                return '7z'
            case 'application/x-bzip':
                return 'BZIP'
            case 'application/x-bzip2':
                return 'BZIP2'
            case 'application/x-gzip':
                return 'GZIP'
            default:
                return value
        }
    }
}