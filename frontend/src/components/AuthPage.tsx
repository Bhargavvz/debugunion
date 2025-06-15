import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, Github, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { AuthMode } from "@/types";

interface AuthPageProps {
  onNavigate: (page: string) => void;
}

export function AuthPage({ onNavigate }: AuthPageProps) {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    firstName: "",
    lastName: "",
    agreeToTerms: false,
  });

  const { login, register, loginWithGoogle, loginWithGithub, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (authMode === "login") {
        await login(formData.email, formData.password);
        onNavigate("dashboard");
      } else if (authMode === "register") {
        if (formData.password !== formData.confirmPassword) {
          throw new Error("Passwords do not match");
        }
        await register(
          formData.email, 
          formData.password, 
          formData.username,
          formData.firstName,
          formData.lastName
        );
        // After successful registration, switch to login mode
        setAuthMode("login");
        // Clear form data except email for convenience
        setFormData(prev => ({
          ...prev,
          password: "",
          confirmPassword: "",
          username: "",
          firstName: "",
          lastName: "",
          agreeToTerms: false,
        }));
      } else if (authMode === "forgot-password") {
        await resetPassword(formData.email);
        setAuthMode("login");
      }
    } catch (error: any) {
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    setIsLoading(true);
    try {
      if (provider === "GitHub") {
        await loginWithGithub();
      } else if (provider === "Google") {
        await loginWithGoogle();
      }
      onNavigate("dashboard");
    } catch (error: any) {
      console.error('Social login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Back to Landing */}
        <Button
          variant="ghost"
          onClick={() => onNavigate("landing")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <Card>
          <CardHeader className="space-y-1 text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-primary text-primary-foreground">
                <span className="text-sm font-bold">DU</span>
              </div>
              <span className="text-2xl font-bold">DebugUnion</span>
            </div>
            <CardTitle className="text-2xl">
              {authMode === "login" && "Welcome back"}
              {authMode === "register" && "Create your account"}
              {authMode === "forgot-password" && "Reset your password"}
            </CardTitle>
            <p className="text-muted-foreground">
              {authMode === "login" && "Sign in to your account to continue"}
              {authMode === "register" && "Join the developer community"}
              {authMode === "forgot-password" &&
                "Enter your email to reset your password"}
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Social Login */}
            {authMode !== "forgot-password" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => handleSocialLogin("GitHub")}
                    disabled={isLoading}
                  >
                    <Github className="mr-2 h-4 w-4" />
                    GitHub
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSocialLogin("Google")}
                    disabled={isLoading}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Google
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {authMode === "register" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="Enter your username"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="First name"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({ ...formData, firstName: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Last name"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>

              {authMode !== "forgot-password" && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {authMode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              )}

              {authMode === "login" && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="remember" />
                    <Label htmlFor="remember" className="text-sm">
                      Remember me
                    </Label>
                  </div>
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 font-normal"
                    onClick={() => setAuthMode("forgot-password")}
                  >
                    Forgot password?
                  </Button>
                </div>
              )}

              {authMode === "register" && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        agreeToTerms: checked as boolean,
                      })
                    }
                    required
                  />
                  <Label htmlFor="terms" className="text-sm">
                    I agree to the{" "}
                    <Button
                      variant="link"
                      className="px-0 h-auto font-normal text-sm"
                    >
                      Terms of Service
                    </Button>{" "}
                    and{" "}
                    <Button
                      variant="link"
                      className="px-0 h-auto font-normal text-sm"
                    >
                      Privacy Policy
                    </Button>
                  </Label>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading
                  ? "Loading..."
                  : authMode === "login"
                    ? "Sign In"
                    : authMode === "register"
                      ? "Create Account"
                      : "Send Reset Link"}
              </Button>
            </form>

            {/* Switch Auth Mode */}
            <div className="text-center text-sm">
              {authMode === "login" ? (
                <>
                  Don't have an account?{" "}
                  <Button
                    variant="link"
                    className="px-0 font-normal"
                    onClick={() => setAuthMode("register")}
                  >
                    Sign up
                  </Button>
                </>
              ) : authMode === "register" ? (
                <>
                  Already have an account?{" "}
                  <Button
                    variant="link"
                    className="px-0 font-normal"
                    onClick={() => setAuthMode("login")}
                  >
                    Sign in
                  </Button>
                </>
              ) : (
                <>
                  Remember your password?{" "}
                  <Button
                    variant="link"
                    className="px-0 font-normal"
                    onClick={() => setAuthMode("login")}
                  >
                    Sign in
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
