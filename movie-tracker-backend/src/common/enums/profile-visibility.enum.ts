//src/common/enums/profile-visibility.enum.ts
import { registerEnumType } from '@nestjs/graphql';

export enum ProfileVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  FOLLOWERS = 'followers',
}

registerEnumType(ProfileVisibility, {
  name: 'ProfileVisibility',
  description: 'The visibility level of a user profile',
});
