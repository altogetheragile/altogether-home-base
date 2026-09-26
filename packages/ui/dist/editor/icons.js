import { Camera, Video, Presentation, PieChart, BarChart3, Gauge, Settings, Wrench, Puzzle, Layers, Phone, Mail, MapPin, Globe, Building2, Briefcase, Repeat, ClipboardCheck, ListChecks, CheckCircle2, Clock, Calendar, Smile, Heart, HeartHandshake, MessagesSquare, MessageCircle, TrendingUp, Rocket, Sparkles, Lightbulb, Route, Map, Compass, Target, Trophy, Medal, Award, Star, BookOpen, GraduationCap, User, Users } from 'lucide-react';

// src/editor/icons.ts
var ICONS = {
  Users,
  User,
  GraduationCap,
  BookOpen,
  Star,
  Award,
  Medal,
  Trophy,
  Target,
  Compass,
  Map,
  Route,
  Lightbulb,
  Sparkles,
  Rocket,
  TrendingUp,
  MessageCircle,
  MessagesSquare,
  HeartHandshake,
  Heart,
  Smile,
  Calendar,
  Clock,
  CheckCircle2,
  ListChecks,
  ClipboardCheck,
  Repeat,
  Briefcase,
  Building2,
  Globe,
  MapPin,
  Mail,
  Phone,
  Layers,
  Puzzle,
  Wrench,
  Settings,
  Gauge,
  BarChart3,
  PieChart,
  Presentation,
  Video,
  Camera
};
var ICON_NAMES = Object.keys(ICONS);
function iconByName(name) {
  if (!name) return null;
  return ICONS[name] ?? null;
}

export { ICONS, ICON_NAMES, iconByName };
