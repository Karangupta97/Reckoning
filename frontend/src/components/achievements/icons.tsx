import {
  Trophy,
  Star,
  Flame,
  Medal,
  User,
  Shield,
  Building,
  Swords,
  Construction,
  Camera,
  Video,
  ShieldCheck,
  Zap,
  CloudRain,
  TrafficCone,
  Award,
  CheckCircle,
  Target,
  ClipboardList,
  Wrench,
  Users,
  Landmark,
  Lock,
  Gift,
  type LucideIcon,
} from "lucide-react";

/* ─── Icon Map ─────────────────────────────────────────────────── */
const ICON_MAP: Record<string, LucideIcon> = {
  trophy: Trophy,
  star: Star,
  flame: Flame,
  medal: Medal,
  user: User,
  shield: Shield,
  building: Building,
  swords: Swords,
  construction: Construction,
  camera: Camera,
  video: Video,
  "shield-check": ShieldCheck,
  zap: Zap,
  "cloud-rain": CloudRain,
  "traffic-cone": TrafficCone,
  award: Award,
  "check-circle": CheckCircle,
  target: Target,
  "clipboard-list": ClipboardList,
  wrench: Wrench,
  users: Users,
  landmark: Landmark,
  lock: Lock,
  gift: Gift,
};

/* ─── Icon Renderer ────────────────────────────────────────────── */
interface IconProps {
  name: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 18, className = "", strokeWidth = 1.8 }: IconProps) {
  const IconComponent = ICON_MAP[name];
  if (!IconComponent) return null;
  return <IconComponent size={size} className={className} strokeWidth={strokeWidth} />;
}

export { ICON_MAP };
