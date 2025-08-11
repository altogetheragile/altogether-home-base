
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useEffect } from "react";
import { getFriendlyAuthError } from "@/utils/authErrors";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn(email, password);
      
      if (!result) {
        console.error('signIn returned undefined');
        toast({
          title: "Error signing in",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = result;

      if (error) {
        const friendly = getFriendlyAuthError(error, 'sign-in');
        toast({
          title: friendly.title,
          description: friendly.description,
          variant: friendly.variant,
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully.",
        });
        navigate("/");
      }
    } catch (err) {
      const friendly = getFriendlyAuthError(err, 'sign-in');
      toast({
        title: friendly.title,
        description: friendly.description,
        variant: friendly.variant,
      });
    }

    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signUp(email, password, fullName);
      
      if (!result) {
        console.error('signUp returned undefined');
        toast({
          title: "Error creating account",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = result;

      if (error) {
        const friendly = getFriendlyAuthError(error, 'sign-up');
        toast({
          title: friendly.title,
          description: friendly.description,
          variant: friendly.variant,
        });
      } else {
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
      }
    } catch (err) {
      const friendly = getFriendlyAuthError(err, 'sign-up');
      toast({
        title: friendly.title,
        description: friendly.description,
        variant: friendly.variant,
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md">
          <Tabs defaultValue="signin" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome Back</CardTitle>
                  <CardDescription>
                    Sign in to your AltogetherAgile account to access your courses and events.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignIn} className="space-y-4" data-testid="sign-in-form">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        data-testid="email-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        data-testid="password-input"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loading}
                      data-testid="signin-submit-button"
                    >
                      {loading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>
                    Join AltogetherAgile to register for events and access exclusive content.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignUp} className="space-y-4" data-testid="sign-up-form">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        data-testid="fullname-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email-signup">Email</Label>
                      <Input
                        id="email-signup"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        data-testid="email-signup-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password-signup">Password</Label>
                      <Input
                        id="password-signup"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        data-testid="password-signup-input"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loading}
                      data-testid="signup-submit-button"
                    >
                      {loading ? "Creating account..." : "Sign Up"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="text-center mt-6">
            <Link to="/" className="text-muted-foreground hover:text-primary">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Auth;
