import { SignIn } from "@clerk/expo/web";

export default function SignInWebScreen() {
  return <SignIn fallbackRedirectUrl="/" signUpUrl="/sign-up" />;
}