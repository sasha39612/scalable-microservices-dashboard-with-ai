import { ObjectType, Field, ID, HideField } from '@nestjs/graphql';

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field()
  name: string;

  @HideField()
  password: string;
}
