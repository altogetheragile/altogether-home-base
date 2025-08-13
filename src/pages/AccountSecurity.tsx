import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const AccountSecurity = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [factors, setFactors] = useState<any[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  // Session step-up (AAL2) test state
  const [stepUpFactorId, setStepUpFactorId] = useState<string | null>(null);
  const [stepUpChallengeId, setStepUpChallengeId] = useState<string | null>(null);
  const [stepUpCode, setStepUpCode] = useState("");

  useEffect(() => {
    document.title = "Account Security | AltogetherAgile";
    refreshFactors();
  }, []);

  const refreshFactors = async () => {
    try {
      const { data, error } = await (supabase as any).auth.mfa.listFactors();
      if (error) throw error;
      setFactors(data?.all ?? []);
    } catch (err: any) {
      console.error(err);
    }
  };

  const startEnroll = async () => {
    setLoading(true);
    try {
      // Check existing factors first to avoid "factor already exists" errors
      const { data: factorsData, error: listErr } = await (supabase as any).auth.mfa.listFactors();
      if (listErr) throw listErr;
      const allFactors = factorsData?.all ?? [];
      const verifiedTotp = allFactors.find((f: any) => (f.type === "totp" || f.factor_type === "totp") && (f.status === "verified" || f.factor_status === "verified"));
      const pendingTotp = allFactors.find((f: any) => (f.type === "totp" || f.factor_type === "totp") && (f.status === "unverified" || f.factor_status === "unverified"));

      if (verifiedTotp) {
        toast({ title: "Already enabled", description: "A TOTP factor is already verified for this account." });
        return;
      }

      if (pendingTotp) {
        setFactorId(pendingTotp.id);
        setUri(pendingTotp.totp?.uri || null);
        setEnrolling(true);
        // Ensure a fresh challenge exists for verification
        const { data: chData, error: chErr } = await (supabase as any).auth.mfa.challenge({ factorId: pendingTotp.id });
        if (chErr) throw chErr;
        setChallengeId(chData?.id || null);
        toast({ title: "Continue setup", description: "Enter the 6‑digit code from your authenticator app." });
        return;
      }

      const { data, error } = await (supabase as any).auth.mfa.enroll({ factorType: "totp", friendlyName: `Authenticator ${Date.now()}` });
      if (error) throw error;
      setFactorId(data.id);
      setUri(data.totp?.uri || null);
      setEnrolling(true);
      // Create a challenge for this new factor (required by API before verify)
      const { data: chData, error: chErr } = await (supabase as any).auth.mfa.challenge({ factorId: data.id });
      if (chErr) throw chErr;
      setChallengeId(chData?.id || null);
      toast({ title: "MFA enrollment started", description: "Scan the QR with your authenticator app." });
    } catch (err: any) {
      toast({ title: "Couldn't start MFA", description: err.message || "Unexpected error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const verifyEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) return;
    setLoading(true);
    try {
      const oneTimeCode = code.replace(/\D/g, '').slice(0, 6);
      if (oneTimeCode.length < 6) {
        toast({ title: "Invalid code", description: "Enter the 6‑digit code from your app.", variant: "destructive" });
        setLoading(false);
        return;
      }

      let cid = challengeId;
      if (!cid) {
        const { data: chData, error: chErr } = await (supabase as any).auth.mfa.challenge({ factorId });
        if (chErr) throw chErr;
        cid = chData?.id || null;
        setChallengeId(cid);
      }

      console.log("🔐 Verifying MFA", { factorId, cid });
      const { error } = await (supabase as any).auth.mfa.verify({ factorId, challengeId: cid, code: oneTimeCode });
      if (error) throw error;

      toast({ title: "Two‑factor enabled", description: "MFA is now active on your account." });
      setEnrolling(false);
      setCode("");
      setUri(null);
      setFactorId(null);
      setChallengeId(null);
      await refreshFactors();
    } catch (err: any) {
      const msg = String(err?.message || "");
      const status = err?.status;
      console.warn("⚠️ MFA verify failed", { status, msg });

      if (status === 422 || /challenge/i.test(msg) || /expired/i.test(msg) || /not found/i.test(msg)) {
        try {
          const { data: chData, error: chErr } = await (supabase as any).auth.mfa.challenge({ factorId });
          if (!chErr) {
            const newCid = chData?.id || null;
            setChallengeId(newCid);
            toast({ title: "Code expired", description: "We refreshed the challenge. Enter a new 6‑digit code from your app." });
            setLoading(false);
            return;
          }
        } catch {}
      }

      toast({ title: "Invalid code", description: msg || "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const disableFactor = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await (supabase as any).auth.mfa.unenroll({ factorId: id });
      if (error) throw error;
      toast({ title: "MFA disabled", description: "The selected factor has been removed." });
      await refreshFactors();
    } catch (err: any) {
      toast({ title: "Couldn't disable", description: err.message || "Unexpected error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const cancelEnroll = async () => {
    // Unenroll pending factor to avoid "factor already exists" issues
    if (!factorId) {
      setEnrolling(false);
      setUri(null);
      setCode("");
      setChallengeId(null);
      return;
    }
    setLoading(true);
    try {
      const { error } = await (supabase as any).auth.mfa.unenroll({ factorId });
      if (error) throw error;
      toast({ title: "Setup reset", description: "Pending MFA setup removed." });
      await refreshFactors();
    } catch (err: any) {
      toast({ title: "Couldn't reset", description: err.message || "Unexpected error", variant: "destructive" });
    } finally {
      setLoading(false);
      setEnrolling(false);
      setUri(null);
      setFactorId(null);
      setCode("");
      setChallengeId(null);
    }
  };

  const refreshChallenge = async () => {
    if (!factorId) return;
    setLoading(true);
    try {
      const { data: chData, error: chErr } = await (supabase as any).auth.mfa.challenge({ factorId });
      if (chErr) throw chErr;
      setChallengeId(chData?.id || null);
      toast({ title: "Challenge refreshed", description: "Enter a new 6‑digit code from your app." });
    } catch (err: any) {
      toast({ title: "Couldn't refresh", description: err.message || "Unexpected error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const forceResetMfa = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any).auth.mfa.listFactors();
      if (error) throw error;
      const all = data?.all ?? [];
      const totps = all.filter((f: any) => (f.type === 'totp' || f.factor_type === 'totp'));
      let removed = 0;
      for (const f of totps) {
        const { error: uerr } = await (supabase as any).auth.mfa.unenroll({ factorId: f.id });
        if (!uerr) removed++;
      }
      toast({ title: "MFA reset", description: `Removed ${removed} TOTP factor(s).` });
      setEnrolling(false);
      setUri(null);
      setFactorId(null);
      setCode("");
      setChallengeId(null);
      await refreshFactors();
    } catch (err: any) {
      toast({ title: "Couldn't reset MFA", description: err.message || "Unexpected error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Proactively test/step-up current session to AAL2
  const testMfaNow = async () => {
    setLoading(true);
    try {
      const { data: aalData } = await (supabase as any).auth.mfa.getAuthenticatorAssuranceLevel();
      console.log('🔎 Current AAL:', aalData);
      if (aalData?.currentLevel === 'aal2') {
        toast({ title: 'Already verified', description: 'Your session is already at AAL2.' });
        return;
      }
      const { data: lf } = await (supabase as any).auth.mfa.listFactors();
      const all = lf?.all ?? [];
      const verifiedTotp = all.find((f: any) => (f.type === 'totp' || f.factor_type === 'totp') && (f.status === 'verified' || f.factor_status === 'verified'));
      if (!verifiedTotp) {
        toast({ title: 'No verified TOTP', description: 'Enable MFA first, then try again.', variant: 'destructive' });
        return;
      }
      const { data: chData, error: chErr } = await (supabase as any).auth.mfa.challenge({ factorId: verifiedTotp.id });
      if (chErr) throw chErr;
      setStepUpFactorId(verifiedTotp.id);
      setStepUpChallengeId(chData?.id || null);
      setStepUpCode('');
      // Route to Auth page to enter code
      sessionStorage.setItem('mfa:prompt', '1');
      toast({ title: 'MFA required', description: 'Enter the 6‑digit code to verify your session.' });
      navigate('/auth');
    } catch (err: any) {
      toast({ title: "Couldn't start test", description: err.message || 'Unexpected error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const verifyStepUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stepUpFactorId) return;
    setLoading(true);
    try {
      const code = stepUpCode.replace(/\D/g, '').slice(0, 6);
      if (code.length < 6) {
        toast({ title: 'Invalid code', description: 'Enter the 6‑digit code.', variant: 'destructive' });
        setLoading(false);
        return;
      }
      const payload: any = { factorId: stepUpFactorId, code };
      if (stepUpChallengeId) payload.challengeId = stepUpChallengeId;
      const { error } = await (supabase as any).auth.mfa.verify(payload);
      if (error) throw error;
      toast({ title: 'Session verified', description: 'Your session is now at AAL2.' });
      setStepUpFactorId(null);
      setStepUpChallengeId(null);
      setStepUpCode('');
    } catch (err: any) {
      toast({ title: 'Invalid code', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const cancelStepUp = () => {
    setStepUpFactorId(null);
    setStepUpChallengeId(null);
    setStepUpCode('');
  };

  const qrSrc = useMemo(() => (uri ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}` : null), [uri]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <main className="flex-1 py-12">
        <div className="container max-w-3xl mx-auto px-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
              <CardDescription>Manage multi‑factor authentication (MFA).</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Current factors */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Enrolled factors</h3>
                {factors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No MFA factors enrolled.</p>
                ) : (
                  <ul className="space-y-2">
                    {factors.map((f) => (
                      <li key={f.id} className="flex items-center justify-between border rounded-md p-3">
                        <div>
                          <div className="font-medium">{f.friendly_name || f.type?.toUpperCase?.() || 'TOTP'}</div>
                          <div className="text-xs text-muted-foreground">Status: {f.status || f.factor_status || 'unknown'}</div>
                          <div className="text-xs text-muted-foreground">ID: {f.id}</div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => disableFactor(f.id)} disabled={loading}>
                          Disable
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button variant="destructive" size="sm" onClick={forceResetMfa} disabled={loading}>
                    Force reset MFA (remove all TOTP)
                  </Button>
                  <Button variant="secondary" size="sm" onClick={testMfaNow} disabled={loading}>
                    Test MFA now
                  </Button>
                </div>
                {stepUpFactorId && (
                  <div className="mt-3 border rounded-md p-3">
                    <h4 className="font-medium mb-2">Verify current session</h4>
                    <form onSubmit={verifyStepUp} className="space-y-2">
                      <div className="space-y-1">
                        <Label htmlFor="stepup-code">6‑digit code</Label>
                        <Input id="stepup-code" value={stepUpCode} onChange={(e) => setStepUpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" inputMode="numeric" maxLength={6} />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" disabled={loading || stepUpCode.length < 6}>Verify</Button>
                        <Button type="button" size="sm" variant="outline" onClick={cancelStepUp}>Cancel</Button>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {/* Enroll new */}
              {!enrolling ? (
                <div className="mt-6">
                  <Button onClick={startEnroll} disabled={loading}>
                    Enable Two‑Factor Auth
                  </Button>
                </div>
              ) : (
                <div className="mt-6 border rounded-md p-4">
                  <h4 className="font-medium mb-2">Finish setup</h4>
                  <p className="text-sm text-muted-foreground mb-4">Scan the QR with Google Authenticator, 1Password, or Authy, then enter the 6‑digit code.</p>
                  {qrSrc ? (
                    <img src={qrSrc} alt="MFA QR code" className="mb-4 mx-auto" />
                  ) : (
                    uri && (
                      <div className="mb-4">
                        <Label>Setup URI</Label>
                        <Input value={uri} readOnly />
                      </div>
                    )
                  )}
                  <form onSubmit={verifyEnroll} className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="mfa-code">6‑digit code</Label>
                      <Input id="mfa-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" inputMode="numeric" maxLength={6} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" disabled={loading || code.length < 6}>Verify & Enable</Button>
                      <Button type="button" variant="secondary" onClick={refreshChallenge} disabled={loading}>Refresh challenge</Button>
                      <Button type="button" variant="outline" onClick={() => { setEnrolling(false); setUri(null); setFactorId(null); setChallengeId(null); setCode(""); }}>Close</Button>
                      <Button type="button" variant="destructive" onClick={cancelEnroll} disabled={loading}>Reset setup (remove pending)</Button>
                    </div>
                  </form>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AccountSecurity;
