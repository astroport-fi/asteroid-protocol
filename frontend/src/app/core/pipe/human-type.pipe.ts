import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'humanType', standalone: true })
export class HumanTypePipe implements PipeTransform {
  transform(value: string) {
    // Cover all image types
    if (value.startsWith('image/')) {
      return 'Image';
    }
    // Cover all video types
    if (value.startsWith('video/')) {
      return 'Video';
    }
    // Cover all audio types
    if (value.startsWith('audio/')) {
      return 'Audio';
    }
    if (value.startsWith('text/html')) {
      return 'HTML';
    }
    // Cover all text types
    if (value.startsWith('text/markdown')) {
      return 'Markdown';
    }
    // Cover all text types
    if (value.startsWith('text/')) {
      return 'Text';
    }
    // Cover all text types
    if (value.startsWith('application/json')) {
      return 'JSON';
    }

    switch (value) {
      case 'application/pdf':
        return 'PDF';
      case 'application/zip':
        return 'ZIP';
      case 'application/x-tar':
        return 'TAR';
      case 'application/x-rar-compressed':
        return 'RAR';
      case 'application/x-7z-compressed':
        return '7z';
      case 'application/x-bzip':
        return 'BZIP';
      case 'application/x-bzip2':
        return 'BZIP2';
      case 'application/x-gzip':
        return 'GZIP';
      default:
        return value;
    }
  }
}
