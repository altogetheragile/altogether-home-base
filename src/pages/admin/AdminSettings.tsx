import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { MODULES, MODULE_GROUPS, NAV_FLAGS, flagOf } from '@/config/modules';
import { Settings, AlertTriangle } from 'lucide-react';
import { TestimonialDisplaySettings } from '@/components/admin/TestimonialDisplaySettings';

// ============= Which parts of the site are switched on =============
//
// Rendered from `MODULES`, the one list of switchable parts, rather than from sixteen hand-written
// blocks. Before this the page carried switches for four flags that were read nowhere - you could
// turn Projects off and nothing happened - and had no switch at all for the games, while 32 public
// routes had nothing in front of them. Adding a module is now a line in that list.
//
// `show_admin_routes` is deliberately not here. A switch that can hide the admin area from inside
// the admin area is a way to lock yourself out of your own site.

type Flags = Record<string, boolean>;

const defaults = (settings: Record<string, unknown> | null | undefined): Flags =>
  Object.fromEntries([...MODULES.map((m) => [flagOf(m), m.defaultOn] as const),
                      ...NAV_FLAGS.map((f) => [f.flag, f.defaultOn] as const)]
    .map(([flag, fallback]) => {
      const v = settings?.[flag];
      return [flag, typeof v === 'boolean' ? v : fallback];
    }));

export default function AdminSettings() {
  const { settings, isLoading, updateSettings } = useSiteSettings();
  const [localSettings, setLocalSettings] = useState<Flags>(() => defaults(settings as unknown as Record<string, unknown>));

  useEffect(() => {
    if (settings) setLocalSettings(defaults(settings as unknown as Record<string, unknown>));
  }, [settings]);

  const handleToggle = (key: string) =>
    setLocalSettings((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSave = () => updateSettings(localSettings);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/4 rounded bg-muted" />
          <div className="h-64 rounded bg-muted" />
        </div>
      </div>
    );
  }

  const off = MODULES.filter((m) => !localSettings[flagOf(m)]).length;

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="mb-6 flex items-center gap-3">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Site Settings</h1>
          <p className="text-muted-foreground">
            Which parts of the site are switched on. Off means the pages are hidden from the menu
            <em> and</em> unreachable, not merely unlinked.
            {off > 0 && <> Currently <strong>{off} off</strong>.</>}
          </p>
        </div>
      </div>

      {MODULE_GROUPS.map((group) => {
        const inGroup = MODULES.filter((m) => m.group === group);
        if (inGroup.length === 0) return null;
        return (
          <Card key={group}>
            <CardHeader>
              <CardTitle>{group}</CardTitle>
              <CardDescription>
                {inGroup.filter((m) => localSettings[flagOf(m)]).length} of {inGroup.length} on
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {inGroup.map((m, i) => (
                <div key={m.feature}>
                  {i > 0 && <Separator className="mb-6" />}
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <Label htmlFor={flagOf(m)} className="flex items-center gap-2 text-base font-medium">
                        {m.label}
                        {m.hasColumn === false && (
                          <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                            <AlertTriangle className="h-3 w-3" /> not saved yet
                          </span>
                        )}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {m.blurb}
                        {m.hasColumn === false && ' This switch has no column on site_settings yet, so it will not persist.'}
                      </p>
                    </div>
                    <Switch
                      id={flagOf(m)}
                      checked={localSettings[flagOf(m)]}
                      disabled={m.hasColumn === false}
                      onCheckedChange={() => handleToggle(flagOf(m))}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      {/* Not modules: these change what is offered, while everything behind them stays reachable
          by its own URL. Separated so it is clear which kind of switch you are looking at. */}
      <Card>
        <CardHeader>
          <CardTitle>Menus</CardTitle>
          <CardDescription>What the site offers, rather than what it allows</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {NAV_FLAGS.map((f, i) => (
            <div key={f.flag}>
              {i > 0 && <Separator className="mb-6" />}
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label htmlFor={f.flag} className="text-base font-medium">{f.label}</Label>
                  <p className="text-sm text-muted-foreground">{f.blurb}</p>
                </div>
                <Switch id={f.flag} checked={localSettings[f.flag]}
                  onCheckedChange={() => handleToggle(f.flag)} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Saves immediately, not staged behind the button below. */}
      <TestimonialDisplaySettings />

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">Save Changes</Button>
      </div>
    </div>
  );
}
