import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatConst',
})
export class FormatConstPipe implements PipeTransform {
  transform(constValue: string): string {
    return constValue
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }
}
