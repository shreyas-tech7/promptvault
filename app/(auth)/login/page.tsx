import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const redirectTo = typeof sp.redirectTo === "string" ? sp.redirectTo : "/";
  const error = typeof sp.error === "string" ? sp.error : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>
          Log in to upvote, save and share your favorite prompts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm redirectTo={redirectTo} initialError={error} />
      </CardContent>
    </Card>
  );
}
