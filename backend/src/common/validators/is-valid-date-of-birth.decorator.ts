import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

const EARLIEST_YEAR = 1926;
const LATEST_YEAR = 2016;

export function IsValidDateOfBirth(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isValidDateOfBirth',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string') {
            return false;
          }

          const date = new Date(value);
          if (Number.isNaN(date.getTime())) {
            return false;
          }

          const year = date.getFullYear();
          return year >= EARLIEST_YEAR && year <= LATEST_YEAR;
        },
        defaultMessage(args: ValidationArguments): string {
          const date = new Date(args.value as string);
          if (
            !Number.isNaN(date.getTime()) &&
            date.getFullYear() > LATEST_YEAR
          ) {
            return 'Sorry, you are not born yet!';
          }
          if (
            !Number.isNaN(date.getTime()) &&
            date.getFullYear() < EARLIEST_YEAR
          ) {
            return 'Sorry, you are too old!';
          }
          return `dateOfBirth must be a real date between ${EARLIEST_YEAR} and ${LATEST_YEAR}`;
        },
      },
    });
  };
}
