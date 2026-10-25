import { SignUp } from "@clerk/expo/web";

export default function SignUpWebScreen() {
  return <SignUp fallbackRedirectUrl="/" signInUrl="/sign-in" />;
}