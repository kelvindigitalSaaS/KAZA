import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Star, Sparkles, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSubscription, PLAN_DETAILS } from '@/contexts/SubscriptionContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { PlansScreen } from './PlansScreen';
import { cn } from '@/lib/utils';

interface CurrentPlanBadgeProps {
 showUpgradeSheet?: boolean;
 className?: string;
}

export function CurrentPlanBadge({ showUpgradeSheet = true, className }: CurrentPlanBadgeProps) {
 const navigate = useNavigate();
 const { subscription, trialDaysRemaining } = useSubscription();
 const [open, setOpen] = useState(false);

 if (!subscription) return null;

 const planDetails = PLAN_DETAILS[subscription.plan];

 const getPlanIcon = () => {
 switch (subscription.plan) {
 case 'premium':
 case 'individualPRO':
 case 'multiPRO':
 return <Crown className="h-3.5 w-3.5" />;
 case 'standard':
 return <Sparkles className="h-3.5 w-3.5" />;
 default:
 return <Star className="h-3.5 w-3.5" />;
 }
 };

 const getBadgeStyles = () => {
 switch (subscription.plan) {
 case 'premium':
 case 'individualPRO':
 case 'multiPRO':
 return 'bg-amber-400/20 text-amber-200 border-amber-400/30 shadow-sm backdrop-blur-xl';
 case 'standard':
 return 'bg-white/15 text-white/90 border-white/20 backdrop-blur-xl';
 default:
 return 'bg-white/10 text-white/70 border-white/15 backdrop-blur-xl';
 }
 };

 const badgeLabel = planDetails.name + (trialDaysRemaining && trialDaysRemaining > 0 ? ` (${trialDaysRemaining}d)` : "");

 const badge = (
	 <Badge
		 className={cn(
			 'cursor-pointer transition-all hover:scale-105 gap-1',
			 getBadgeStyles(),
			 className
		 )}
	 >
		 {getPlanIcon()}
		 {badgeLabel}
	 </Badge>
 );

 if (!showUpgradeSheet || subscription.plan === 'premium') {
 return badge;
 }

 if (subscription.plan === 'individualPRO' || subscription.plan === 'multiPRO') {
 return (
 <button
 onClick={() => navigate('/app/settings/subscription/manage')}
 className="hover:opacity-80 transition-opacity"
 >
 {badge}
 </button>
 );
 }

 return (
 <Sheet open={open} onOpenChange={setOpen}>
 <SheetTrigger asChild>
 {badge}
 </SheetTrigger>
 <SheetContent side="bottom" className="h-[90vh] p-0 rounded-t-3xl">
 <PlansScreen onClose={() => setOpen(false)} />
 </SheetContent>
 </Sheet>
 );
}
