import {
  Users, User, GraduationCap, BookOpen, Star, Award, Medal, Trophy,
  Target, Compass, Map, Route, Lightbulb, Sparkles, Rocket, TrendingUp,
  MessageCircle, MessagesSquare, HeartHandshake, Heart, Smile,
  Calendar, Clock, CheckCircle2, ListChecks, ClipboardCheck, Repeat,
  Briefcase, Building2, Globe, MapPin, Mail, Phone, Layers, Puzzle,
  Wrench, Settings, Gauge, BarChart3, PieChart, Presentation, Video, Camera,
  type LucideIcon,
} from 'lucide-react';

// ============= The icons a site can choose from =============
//
// Named and explicit, rather than looking a name up in the whole of lucide-react at runtime. A
// dynamic lookup defeats tree-shaking and drags every icon in the library into the bundle, which
// for a marketing page is roughly a megabyte to let somebody pick a tick.
//
// Anything added here must exist in the lucide version this package pins, which is older than
// the Site's: Handshake does not, HeartHandshake does. A name that is not there fails the build
// rather than rendering nothing, which is the right way round.
//
// Forty-odd is a choice, not a limit of the technique: enough that a coach, a trainer, a
// photographer and a therapist can all find something that means what they mean, few enough that
// picking one is a decision rather than a search. Add more when somebody actually wants one.

export const ICONS: Record<string, LucideIcon> = {
  Users, User, GraduationCap, BookOpen, Star, Award, Medal, Trophy,
  Target, Compass, Map, Route, Lightbulb, Sparkles, Rocket, TrendingUp,
  MessageCircle, MessagesSquare, HeartHandshake, Heart, Smile,
  Calendar, Clock, CheckCircle2, ListChecks, ClipboardCheck, Repeat,
  Briefcase, Building2, Globe, MapPin, Mail, Phone, Layers, Puzzle,
  Wrench, Settings, Gauge, BarChart3, PieChart, Presentation, Video, Camera,
};

export const ICON_NAMES = Object.keys(ICONS);

/** An unknown name renders nothing rather than throwing. A page should not go down because
 *  somebody typed an icon name that no longer exists. */
export function iconByName(name: string | undefined | null): LucideIcon | null {
  if (!name) return null;
  return ICONS[name] ?? null;
}
