import {bindable} from 'aurelia-framework';
import { IEnumFormField } from '../../contracts';

export class DynamicUiRadioButtonElement {

  @bindable()
  public field: IEnumFormField;

  public activate(field: IEnumFormField): void {
    this.field = field;
    if (this.field.value === undefined || this.field.value === null || this.field.value === '') {
      this.field.value = this.field.defaultValue;
    }
  }
}
