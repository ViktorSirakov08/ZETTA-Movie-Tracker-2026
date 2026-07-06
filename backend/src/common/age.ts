import { AgeRestriction } from '../media/entity/media.entity';

export function calculateAge(dateOfBirth: string, referenceDate = new Date()): number {
  const dob = new Date(dateOfBirth);
  let age = referenceDate.getFullYear() - dob.getFullYear();

  const hasHadBirthdayThisYear =
    referenceDate.getMonth() > dob.getMonth() ||
    (referenceDate.getMonth() === dob.getMonth() &&
      referenceDate.getDate() >= dob.getDate());

  if (!hasHadBirthdayThisYear) {
    age--;
  }

  return age;
}

export function minimumAgeFor(restriction: AgeRestriction): number {
  switch (restriction) {
    case AgeRestriction.PG18:
      return 18;
    case AgeRestriction.PG13:
      return 13;
    default:
      return 0;
  }
}