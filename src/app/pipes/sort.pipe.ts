import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sort'
})
export class SortPipe implements PipeTransform {

  transform(array: any[], field?: string): any[] {
    if (!array) return [];

    return array.sort((a, b) => {
      const aField = field ? a[field] : a;
      const bField = field ? b[field] : b;
      return aField.localeCompare(bField);
    });
  }

}
