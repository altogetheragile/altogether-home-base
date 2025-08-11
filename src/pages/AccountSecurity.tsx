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

const AccountSecurity = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [factors, setFactors] = useState<any[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [code, setCode] = useState("");

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
      const { data, error } = await (supabase as any).auth.mfa.enroll({ factorType: "totp" });
      if (error) throw error;
      setFactorId(data.id);
      setUri(data.totp?.uri || null);
      setEnrolling(true);
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
      const { error } = await (supabase as any).auth.mfa.verify({ factorId, code });
      if (error) throw error;
      toast({ title: "Two‑factor enabled", description: "MFA is now active on your account." });
      setEnrolling(false);
      setCode("");
      setUri(null);
      setFactorId(null);
      await refreshFactors();
    } catch (err: any) {
      toast({ title: "Invalid code", description: err.message || "Please try again.", variant: "destructive" });
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
                          <div className="text-xs text-muted-foreground">ID: {f.id}</div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => disableFactor(f.id)} disabled={loading}>
                          Disable
                        </Button>
                      </li>
                    ))}
                  </ul>
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
                      <Input id="mfa-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" inputMode="numeric" maxLength={6} />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={loading || code.length < 6}>Verify & Enable</Button>
                      <Button type="button" variant="outline" onClick={() => { setEnrolling(false); setUri(null); setFactorId(null); setCode(""); }}>Cancel</Button>
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
