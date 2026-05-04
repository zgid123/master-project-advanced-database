import { type } from 'arktype';

import { User } from './user';

export const SignIn = User.pick('email', 'password');

export const SignUp = User.pick('email', 'password');

export const Token = type({
  token: 'string',
});

export type TSignIn = typeof SignIn.infer;

export type TSignUp = typeof SignUp.infer;

export type TToken = typeof Token.infer;
