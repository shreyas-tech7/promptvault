import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignupForm } from "@/components/auth/signup-form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const redirectTo = typeof sp.redirectTo === "string" ? sp.redirectTo : "/";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Create your account</CardTitle>
        <CardDescription>
          Join PromptVault to publish prompts and upvote the best ones.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignupForm redirectTo={redirectTo} />
      </CardContent>
    </Card>
  );
}
