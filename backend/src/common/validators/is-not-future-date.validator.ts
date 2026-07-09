import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isNotBeyondMaxFutureDate', async: false })
export class IsNotBeyondMaxFutureDateConstraint implements ValidatorConstraintInterface {
  validate(value: string, args?: ValidationArguments): boolean {
    if (typeof value !== 'string' || value.length === 0) {
      return false;
    }

    const releaseDate = new Date(`${value}T00:00:00`);
    if (Number.isNaN(releaseDate.getTime())) {
      return false;
    }

    const maxMonthsAhead = (args?.constraints[0] as number) ?? 0;

    const maxDate = new Date();
    maxDate.setHours(0, 0, 0, 0);
    maxDate.setMonth(maxDate.getMonth() + maxMonthsAhead);

    return releaseDate <= maxDate;
  }

  defaultMessage(args?: ValidationArguments): string {
    const maxMonthsAhead = (args?.constraints[0] as number) ?? 0;
    return maxMonthsAhead === 0
      ? 'Release date cannot be in the future'
      : `Release date cannot be more than ${maxMonthsAhead} months in the future`;
  }
}

export function IsNotFutureDate(
  maxMonthsAhead = 0,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [maxMonthsAhead],
      validator: IsNotBeyondMaxFutureDateConstraint,
    });
  };
}