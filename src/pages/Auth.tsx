
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
import { supabase } from "@/integrations/supabase/client";
import { cleanupAuthState } from "@/utils/authCleanup";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  // MFA state
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaFactors, setMfaFactors] = useState<any[]>([]);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaChallengeId, setMfaChallengeId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");

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
      // Reset any previous MFA state
      setMfaRequired(false);
      setMfaFactorId(null);
      setMfaChallengeId(null);
      setMfaCode("");

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

      const { data, error } = result;

      if (error) {
        const isMfaError = (error as any)?.name === 'AuthMFAError' || /mfa|factor/i.test((error as any)?.message || '');
        if (isMfaError) {
          await handleStartMfa(((error as any)?.mfa?.factors) || (error as any)?.meta?.factors);
          setLoading(false);
          return;
        }
        const friendly = getFriendlyAuthError(error, 'sign-in');
        toast({ title: friendly.title, description: friendly.description, variant: friendly.variant });
        setLoading(false);
        return;
      }

      // No error: check if MFA is required but not signaled via error
      const maybeFactors = (data as any)?.mfa?.factors;
      const hasSession = !!(data as any)?.session;
      const hasUser = !!(data as any)?.user;
      if (!hasSession && (Array.isArray(maybeFactors) ? maybeFactors.length > 0 : hasUser)) {
        await handleStartMfa(maybeFactors);
        setLoading(false);
        return;
      }

      toast({ title: "Welcome back!", description: "You have been signed in successfully." });
      navigate("/");
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

  // Start MFA challenge after an MFA-required sign-in response
  const handleStartMfa = async (factorsHint?: any[]) => {
    try {
      let factors = Array.isArray(factorsHint) ? factorsHint : [];
      if (!Array.isArray(factors) || factors.length === 0) {
        try {
          const { data } = await (supabase as any).auth.mfa.listFactors();
          factors = data?.all ?? [];
        } catch {}
      }
      setMfaFactors(factors);
      const totp = factors.find((f: any) => (f.factor_type ?? f.type) === "totp") ?? factors[0];
      if (!totp) {
        throw new Error("No MFA factors found for this account.");
      }
      const { data: chData, error: chErr } = await (supabase as any).auth.mfa.challenge({ factorId: totp.id });
      if (chErr) throw chErr;
      setMfaFactorId(totp.id);
      setMfaChallengeId(chData?.id ?? chData?.challengeId ?? null);
      setMfaRequired(true);
      toast({ title: "MFA required", description: "Enter the 6‑digit code from your authenticator app." });
    } catch (err: any) {
      toast({ title: "MFA challenge failed", description: err?.message || "Please try again.", variant: "destructive" });
    }
  };

  // Verify the TOTP code to complete sign in
  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaFactorId) return;
    setLoading(true);
    try {
      const payload: any = { factorId: mfaFactorId, code: mfaCode };
      if (mfaChallengeId) payload.challengeId = mfaChallengeId;
      const { error } = await (supabase as any).auth.mfa.verify(payload);
      if (error) throw error;
      setMfaRequired(false);
      setMfaCode("");
      setMfaChallengeId(null);
      toast({ title: "Signed in", description: "MFA verified successfully." });
      navigate("/");
    } catch (err: any) {
      toast({ title: "Invalid code", description: err?.message || "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const cancelMfa = async () => {
    setMfaRequired(false);
    setMfaFactorId(null);
    setMfaChallengeId(null);
    setMfaCode("");
    try {
      cleanupAuthState();
      await (supabase as any).auth.signOut({ scope: "global" });
    } catch {}
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Enter your email",
        description: "Please enter your email above, then click Forgot password.",
        variant: "destructive",
      });
      return;
    }
    try {
      const redirectTo = `${window.location.origin}/auth/reset`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) {
        const friendly = getFriendlyAuthError(error, 'sign-in');
        toast({ title: friendly.title, description: friendly.description, variant: friendly.variant });
      } else {
        toast({
          title: "Reset link sent",
          description: "Check your email for a password reset link.",
        });
      }
    } catch (err) {
      const friendly = getFriendlyAuthError(err, 'sign-in');
      toast({ title: friendly.title, description: friendly.description, variant: friendly.variant });
    }
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
                  <form onSubmit={mfaRequired ? handleVerifyMfa : handleSignIn} className="space-y-4" data-testid="sign-in-form">
                    {!mfaRequired ? (
                      <>
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
                        <div className="mt-2 text-right">
                          <button
                            type="button"
                            onClick={handleForgotPassword}
                            className="text-sm text-muted-foreground hover:text-primary"
                          >
                            Forgot password?
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">Enter the 6‑digit code from your authenticator app.</p>
                        <div className="space-y-2">
                          <Label htmlFor="mfa-code">6‑digit code</Label>
                          <Input
                            id="mfa-code"
                            value={mfaCode}
                            onChange={(e) => setMfaCode(e.target.value)}
                            placeholder="123456"
                            inputMode="numeric"
                            maxLength={6}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" disabled={loading || mfaCode.length < 6}>Verify</Button>
                          <Button type="button" variant="outline" onClick={cancelMfa}>Cancel</Button>
                        </div>
                      </>
                    )}
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
