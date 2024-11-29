import { Injectable } from '@angular/core';
import { ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import * as moment from 'moment';

export interface FieldValidationConfig {
  customPattern?: RegExp; // Custom pattern to match (e.g., alphanumeric, numeric only, etc.)
  requiredLength?: number; // Expected length of the field
  restrictedCharsPattern?: RegExp; // Pattern for restricted characters
}

@Injectable({
  providedIn: 'root'
})
export class UtilService {

  constructor() { }

  formatDateForDb(dateString: string): string {
    return moment(dateString).format('YYYY-MM-DD');
  }

  globalFieldValidator(config: FieldValidationConfig): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
  
      if (!value) {
        return null;
      }
  
      if (config.customPattern && !config.customPattern.test(value)) {
        return { invalidFormat: true };
      }
  
      if (config.requiredLength && value.length !== config.requiredLength) {
        return { invalidLength: { requiredLength: config.requiredLength } };  // Add requiredLength to error object
      }
  
      if (config.restrictedCharsPattern && config.restrictedCharsPattern.test(value)) {
        return { invalidChars: true };
      }
  
      return null;
    };
  }

  generateRandomPassword(passwordLength: number) {
    const lowerCaseLetters = 'abcdefghijkmnopqrstuvwxyz';
    const upperCaseLetters = 'ABCDEFGHJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#&';

    let availableCharacters = lowerCaseLetters + upperCaseLetters + numbers + symbols;

    availableCharacters.split('')
    const generatedPassword = []

    for (let i = 0; i < passwordLength; i += 1) {
      const max = availableCharacters.length
      const ran = Math.random()
      const idx = Math.floor(ran * (max + 1))

      generatedPassword.push(availableCharacters[idx])

    }
    return generatedPassword.join('');
  }

  capitalizeFirstLetterOfEachWord(text: string): string {
    return text
      .split(' ')  
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())  // Capitalize the first letter and lowercase the rest
      .join(' '); 
  }

  constructAndValidJSONArray(str: string) {
    const validJsonString = str.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3').replace(/'/g, '"');

    try {
      return JSON.parse(validJsonString);
    } catch (error) {
      console.error('Parsing error:', error);
      return null;
    }
    
  }

}


