import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface FabAddButtonProps {
    activeTab?: string;
}

export function FabAddButton({ activeTab }: FabAddButtonProps) {
    const navigate = useNavigate();

    // Only show on home and fridge tabs
    if (activeTab && !['home', 'fridge'].includes(activeTab)) return null;

    return (
        <Button
            onClick={() => navigate('/app/add-item')}
            size="icon"
            className="fixed bottom-24 right-5 z-40 h-14 w-14 rounded-2xl shadow-xl shadow-primary/30 transition-all duration-200 hover:scale-105 active:scale-95"
        >
            <Plus className="h-6 w-6" />
        </Button>
    );
}
