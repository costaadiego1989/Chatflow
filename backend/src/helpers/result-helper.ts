export type ValidationResult = {
  isValid: boolean;
  error?: string;
};

export type Result<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

export class ResultHelper {
  static success<T>(data?: T): Result<T> {
    return {
      success: true,
      data,
    };
  }

  static failure(error: string): Result {
    return {
      success: false,
      error,
    };
  }

  static validationSuccess(): ValidationResult {
    return {
      isValid: true,
    };
  }

  static validationFailure(error: string): ValidationResult {
    return {
      isValid: false,
      error,
    };
  }

  static fromValidation(validationResult: ValidationResult): Result {
    if (validationResult.isValid) {
      return this.success();
    }
    return this.failure(validationResult.error);
  }
}
