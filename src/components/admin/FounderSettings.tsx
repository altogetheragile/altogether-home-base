import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

// ============= Does this site have a founder? =============
//
// This one did, unavoidably: a photograph above the fold on the home page, a first-person
// paragraph, and Person structured data naming him. None of it switchable, so a second site stood
// up from this repository introduced somebody else's founder to its own customers.
//
// Off means the blocks are not rendered at all, rather than rendered empty. A co-operative, a
// partnership, or a business that would rather lead with its work turns this off and never thinks
// about it again.
//
// The words live in Site Copy (home.founder.*, about.founder.*) and the photographs in Brand
// Images. Only the two facts that are not sentences are here.

export function FounderSettings({
  shown, name, onChange,
}: {
  shown: boolean;
  name: string;
  onChange: (next: { show_founder: boolean; founder_name: string }) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Founder</CardTitle>
        <CardDescription>
          Whether this site introduces the person behind it. Their words are in Site Copy and their
          photographs in Brand Images.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="show_founder" className="text-base font-medium">Show a founder section</Label>
            <p className="text-sm text-muted-foreground">
              The portrait on the home page and the biography on the About page. Off removes both,
              and stops the site claiming a founder in its structured data.
            </p>
          </div>
          <Switch
            id="show_founder"
            checked={shown}
            onCheckedChange={(v) => onChange({ show_founder: v, founder_name: name })}
          />
        </div>

        {shown && (
          <div className="space-y-1.5">
            <Label htmlFor="founder_name" className="text-sm font-medium">Their name</Label>
            <p className="text-xs text-muted-foreground">
              Used in structured data and as the alt text on their photographs, where a sentence
              would be the wrong shape.
            </p>
            <Input
              id="founder_name"
              value={name}
              placeholder="Alun Davies-Baker"
              onChange={(e) => onChange({ show_founder: shown, founder_name: e.target.value })}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
