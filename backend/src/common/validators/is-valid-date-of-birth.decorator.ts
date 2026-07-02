import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

const EARLIEST_YEAR = 1900;

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

          return (
            date.getFullYear() >= EARLIEST_YEAR && date.getTime() <= Date.now()
          );
        },
        defaultMessage(args: ValidationArguments): string {
          const date = new Date(args.value as string);
          if (!Number.isNaN(date.getTime()) && date.getTime() > Date.now()) {
            return 'Sorry, you are not born yet!';
          }
          if (
            !Number.isNaN(date.getTime()) &&
            date.getFullYear() < EARLIEST_YEAR
          ) {
            return 'Sorry, you are too old!';
          }
          return `dateOfBirth must be a real date between ${EARLIEST_YEAR} and today`;
        },
      },
    });
  };
}
