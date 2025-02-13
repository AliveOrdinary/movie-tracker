// src/lib/auth/authService.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification as firebaseSendEmailVerification,
  sendPasswordResetEmail,
  confirmPasswordReset,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { ApolloClient } from '@apollo/client';
import {
  LOGIN_MUTATION,
  LOGOUT_MUTATION,
  SEND_EMAIL_VERIFICATION,
  CONFIRM_EMAIL_VERIFICATION,
  INITIATE_PASSWORD_RESET,
  CHANGE_PASSWORD,
} from '@/types/graphql/auth';

interface LoginInput {
  email: string;
  password: string;
}

interface SignUpInput extends LoginInput {
  username: string;
}

interface ChangePasswordInput {
  oldPassword: string;
  newPassword: string;
}

export class AuthService {
  constructor(private apolloClient: ApolloClient<any>) {}

  async login({ email, password }: LoginInput) {
    // First, authenticate with Firebase
    const { user: firebaseUser } = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Then, authenticate with our backend
    await this.apolloClient.mutate({
      mutation: LOGIN_MUTATION,
      variables: { input: { email, password } },
    });

    return firebaseUser;
  }

  async signUp({ email, password, username }: SignUpInput) {
    const { user: firebaseUser } = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Backend will handle user creation through Firebase Auth trigger
    return firebaseUser;
  }

  async logout() {
    await this.apolloClient.mutate({ mutation: LOGOUT_MUTATION });
    await signOut(auth);
  }

  async sendEmailVerification(user: FirebaseUser) {
    await firebaseSendEmailVerification(user);
    await this.apolloClient.mutate({ mutation: SEND_EMAIL_VERIFICATION });
  }

  async confirmEmailVerification(code: string) {
    await this.apolloClient.mutate({
      mutation: CONFIRM_EMAIL_VERIFICATION,
      variables: { code },
    });
  }

  async initiatePasswordReset(email: string) {
    await sendPasswordResetEmail(auth, email);
    await this.apolloClient.mutate({
      mutation: INITIATE_PASSWORD_RESET,
      variables: { email },
    });
  }

  async confirmPasswordReset(code: string, newPassword: string) {
    await confirmPasswordReset(auth, code, newPassword);
  }

  async changePassword({ oldPassword, newPassword }: ChangePasswordInput) {
    await this.apolloClient.mutate({
      mutation: CHANGE_PASSWORD,
      variables: { input: { oldPassword, newPassword } },
    });
  }
}