import {
  Briefcase,
  ChartLine,
  GraduationCap,
  HandHeart,
  HeartPulse,
  Home,
  Landmark,
  ShoppingBag,
  TrendingUp,
  Trophy,
  Users,
  Wallet,
} from 'lucide-react'

const ICONS = {
  briefcase: Briefcase,
  'trending-up': TrendingUp,
  wallet: Wallet,
  users: Users,
  'heart-pulse': HeartPulse,
  home: Home,
  'graduation-cap': GraduationCap,
  'shopping-bag': ShoppingBag,
  'hand-heart': HandHeart,
  landmark: Landmark,
  'chart-line': ChartLine,
  trophy: Trophy,
}

export default function DomainIcon({ name = 'briefcase', className = 'h-4 w-4' }) {
  const Icon = ICONS[name] ?? Briefcase
  return <Icon className={className} aria-hidden strokeWidth={2.25} />
}
