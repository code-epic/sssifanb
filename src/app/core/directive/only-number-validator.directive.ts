import { Directive } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, ValidatorFn } from '@angular/forms';

export function onlyNumberValidator(): ValidatorFn {

  const Input_REGEXP = /^[0-9,]*$/i;

  return (control: AbstractControl): ValidationErrors | null => {
    const isValid = Input_REGEXP.test(control.value);

    if (isValid) return null;
    else {
      return {
        onlyNumberValidator: {
          valid: false,
        },
      };
    }
  };

}
@Directive({
  selector: '[appOnlyNumberValidator]',
  providers: [{
    provide: NG_VALIDATORS,
    useExisting: OnlyNumberValidatorDirective,
    multi: true,
  }],
})
export class OnlyNumberValidatorDirective {

  constructor() { }

  public validate(control: AbstractControl): ValidationErrors | null {
    return onlyNumberValidator()(control);
  }

}
