import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // MFA state
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaVerified, setMfaVerified] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaChallengeId, setMfaChallengeId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Reset Password | AltogetherAgile";

    // Check if the user has MFA enabled and needs to verify before resetting
    const checkMfa = async () => {
      try {
        const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aalData?.currentLevel === 'aal2') {
          // Already at AAL2, no MFA step needed
          setMfaVerified(true);
          setChecking(false);
          return;
        }

        const { data: factors } = await supabase.auth.mfa.listFactors();
        const verifiedTotp = factors?.all?.find(
          (f) => f.factor_type === 'totp' && f.status === 'verified'
        );

        if (verifiedTotp) {
          // MFA is enabled — need to verify before allowing password change
          setMfaRequired(true);
          setMfaFactorId(verifiedTotp.id);
          const { data: challenge, error } = await supabase.auth.mfa.challenge({
            factorId: verifiedTotp.id,
          });
          if (error) {
            console.error('MFA challenge error:', error);
            toast({ title: "MFA error", description: error.message, variant: "destructive" });
          } else {
            setMfaChallengeId(challenge?.id ?? null);
          }
        }
      } catch (err) {
        console.error('MFA check failed:', err);
      } finally {
        setChecking(false);
      }
    };

    checkMfa();
  }, []);

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaFactorId || !mfaChallengeId) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: mfaChallengeId,
        code: mfaCode,
      });
      if (error) throw error;
      setMfaVerified(true);
      setMfaRequired(false);
      toast({ title: "Verified", description: "You can now set your new password." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Please try again.";
      // Refresh challenge on expiry
      if (/expired|not found/i.test(message)) {
        try {
          const { data } = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
          setMfaChallengeId(data?.id ?? null);
          setMfaCode("");
          toast({ title: "Code expired", description: "Enter your latest 6-digit code." });
        } catch (refreshErr) {
          console.error('MFA challenge refresh failed:', refreshErr);
        }
      } else {
        toast({ title: "Invalid code", description: message, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Passwords don't match", description: "Please re-enter your password.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast({ title: "Could not update password", description: error.message, variant: "destructive" });
      } else if (data?.user) {
        toast({ title: "Password updated", description: "You can now sign in with your new password." });
        navigate("/auth");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <div className="flex-1 flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Reset Password</CardTitle>
              <CardDescription>
                {mfaRequired && !mfaVerified
                  ? "Verify your authenticator app to continue."
                  : "Enter a new password for your account."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mfaRequired && !mfaVerified ? (
                <form onSubmit={handleVerifyMfa} className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Your account has two-factor authentication enabled. Enter the 6-digit code from your authenticator app.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="mfa-code">6-digit code</Label>
                    <Input
                      id="mfa-code"
                      value={mfaCode}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setMfaCode(v);
                      }}
                      placeholder="123456"
                      inputMode="numeric"
                      maxLength={6}
                      autoFocus
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading || mfaCode.length < 6}>
                    {loading ? "Verifying..." : "Verify"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoFocus />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input id="confirm-password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Updating..." : "Update Password"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ResetPassword;
