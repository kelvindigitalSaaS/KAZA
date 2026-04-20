import { Crown, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubscription, PLAN_DETAILS } from '@/contexts/SubscriptionContext';
import { cn } from '@/lib/utils';

interface PlanLimitCardProps {
 type: 'items' | 'recipes' | 'shopping';
 currentCount?: number;
 onUpgrade?: () => void;
 className?: string;
}

export function PlanLimitCard({ type, currentCount = 0, onUpgrade, className }: PlanLimitCardProps) {
 const { subscription, getRemainingItems, getRemainingRecipes, getRemainingShoppingItems } = useSubscription();

 if (!subscription) return null;

 const planDetails = PLAN_DETAILS[subscription.plan];
 const isUnlimited = subscription.plan === 'premium';

 const getLimitInfo = () => {
 switch (type) {
 case 'items': {
 const itemsLimit = subscription.itemsLimit;
 const itemsRemaining = getRemainingItems();
 return {
 label: 'Itens na Geladeira',
 current: currentCount,
 limit: itemsLimit,
 remaining: itemsRemaining === -1 ? -1 : itemsLimit - currentCount,
 icon: '🧊'
 };
 }
 case 'recipes': {
 const recipesRemaining = getRemainingRecipes();
 return {
 label: 'Receitas Hoje',
 current: subscription.recipesUsedToday,
 limit: subscription.recipesPerDay,
 remaining: recipesRemaining,
 icon: '🍳'
 };
 }
 case 'shopping': {
 const shoppingRemaining = getRemainingShoppingItems(currentCount);
 return {
 label: 'Itens na Lista',
 current: currentCount,
 limit: subscription.shoppingListLimit,
 remaining: shoppingRemaining,
 icon: '🛒'
 };
 }
 }
 };

 const info = getLimitInfo();
 const percentage = info.limit === -1 ? 100 : Math.min((info.current / info.limit) * 100, 100);
 const isNearLimit = percentage >= 80 && info.limit !== -1;
 const isAtLimit = percentage >= 100 && info.limit !== -1;

 return (
 <Card className={cn(
 'border transition-all duration-300',
 isAtLimit ? 'border-destructive/50 bg-destructive/5' : 
 isNearLimit ? 'border-warning/50 bg-warning/5' : 
 'border-gray-200',
 className
 )}>
 <CardContent className="p-4">
 <div className="flex items-center justify-between mb-2">
 <div className="flex items-center gap-2">
 <span className="text-lg">{info.icon}</span>
 <span className="text-sm font-medium text-foreground">{info.label}</span>
 </div>
 {!isUnlimited && (
 <span className={cn(
 'text-xs font-medium px-2 py-0.5 rounded-full',
 isAtLimit ? 'bg-destructive/10 text-destructive' :
 isNearLimit ? 'bg-warning/10 text-warning' :
 'bg-muted text-gray-500'
 )}>
 {info.current}/{info.limit}
 </span>
 )}
 {isUnlimited && (
 <span className="text-xs font-medium px-2 py-0.5 rounded-full text-amber-600">
 ∞ Ilimitado
 </span>
 )}
 </div>

 {!isUnlimited && (
 <>
 <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
 <div 
 className={cn(
 'h-full rounded-full transition-all duration-500',
 isAtLimit ? 'bg-destructive' :
 isNearLimit ? 'bg-warning' :
 'bg-primary'
 )}
 style={{ width: `${percentage}%` }}
 />
 </div>

 {isAtLimit && (
 <div className="flex items-center justify-between mt-3">
 <div className="flex items-center gap-1.5 text-destructive">
 <Lock className="h-3.5 w-3.5" />
 <span className="text-xs font-medium">Limite atingido</span>
 </div>
 {onUpgrade && (
 <Button 
 size="sm" 
 onClick={onUpgrade}
 className="h-7 text-xs rounded-full"
 >
 <Crown className="h-3 w-3 mr-1" />
 Upgrade
 </Button>
 )}
 </div>
 )}

 {isNearLimit && !isAtLimit && (
 <p className="text-xs text-warning">
 Restam apenas {info.remaining} {type === 'recipes' ? 'receita(s)' : 'item(s)'}
 </p>
 )}
 </>
 )}
 </CardContent>
 </Card>
 );
}

interface UpgradePromptProps {
 feature: string;
 onUpgrade?: () => void;
 onClose?: () => void;
}

export function UpgradePrompt({ feature, onUpgrade, onClose }: UpgradePromptProps) {
 return (
 <Card className="border-primary/30 shadow-sm">
 <CardHeader className="pb-2">
 <div className="flex items-center justify-center mb-2">
 <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
 <Crown className="h-6 w-6 text-primary" />
 </div>
 </div>
 <CardTitle className="text-center text-lg">Limite Atingido</CardTitle>
 <CardDescription className="text-center">
 Você atingiu o limite de {feature} do seu plano atual.
 </CardDescription>
 </CardHeader>
 <CardContent className="space-y-3">
 <Button 
 className="w-full h-11"
 onClick={onUpgrade}
 >
 Ver Planos
 <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 {onClose && (
 <Button 
 variant="ghost" 
 className="w-full"
 onClick={onClose}
 >
 Continuar no plano atual
 </Button>
 )}
 </CardContent>
 </Card>
 );
}
