import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useKaza } from '@/contexts/KazaContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Camera, Save, User, Users, Home, Refrigerator, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileSettingsProps {
 open: boolean;
 onClose: () => void;
}

export function ProfileSettings({ open, onClose }: ProfileSettingsProps) {
 const { onboardingData, updateProfile } = useKaza();
 const { t, language } = useLanguage();
 const { user } = useAuth();
 
 const [name, setName] = useState('');
 const [residents, setResidents] = useState('2');
 const [homeType, setHomeType] = useState<'apartment' | 'house'>('apartment');
 const [fridgeType, setFridgeType] = useState<'regular' | 'smart'>('regular');
 const [fridgeBrand, setFridgeBrand] = useState('');
 const [avatarUrl, setAvatarUrl] = useState('');
 const [saving, setSaving] = useState(false);
 const [uploadingPhoto, setUploadingPhoto] = useState(false);

 // Sync state when sheet opens or data changes
 useEffect(() => {
 if (open && onboardingData) {
 setName(onboardingData.name || '');
 setResidents(onboardingData.residents?.toString() || '2');
 setHomeType(onboardingData.homeType || 'apartment');
 setFridgeType(onboardingData.fridgeType || 'regular');
 setFridgeBrand(onboardingData.fridgeBrand || '');
 setAvatarUrl(onboardingData.avatarUrl || '');
 }
 }, [open, onboardingData]);

 const handleSave = async () => {
 setSaving(true);
 try {
 await updateProfile?.({
 name,
 residents: parseInt(residents) || 2,
 homeType,
 fridgeType,
 fridgeBrand,
 avatarUrl,
 });
 
 const successMsg = {
 'pt-BR': 'Perfil atualizado!',
 'en': 'Profile updated!',
 'es': '¡Perfil actualizado!'
 };
 toast.success(successMsg[language]);
 onClose();
 } catch (error) {
 console.error('Error saving profile:', error);
 } finally {
 setSaving(false);
 }
 };

 const labels = {
 'pt-BR': {
 editProfile: 'Editar Perfil',
 changePhoto: 'Alterar foto',
 photoUpdated: 'Foto atualizada!',
 name: 'Nome',
 yourName: 'Seu nome',
 residents: 'Moradores',
 howMany: 'Quantos moradores?',
 person: 'pessoa',
 people: 'pessoas',
 homeType: 'Tipo de Moradia',
 apartment: 'Apartamento',
 house: 'Casa',
 fridgeType: 'Tipo de Geladeira',
 regular: 'Comum',
 smart: 'Smart',
 fridgeBrand: 'Marca da Geladeira',
 selectBrand: 'Selecione a marca',
 other: 'Outra',
 saveChanges: 'Salvar Alterações',
 },
 'en': {
 editProfile: 'Edit Profile',
 changePhoto: 'Change photo',
 photoUpdated: 'Photo updated!',
 name: 'Name',
 yourName: 'Your name',
 residents: 'Residents',
 howMany: 'How many residents?',
 person: 'person',
 people: 'people',
 homeType: 'Home Type',
 apartment: 'Apartment',
 house: 'House',
 fridgeType: 'Fridge Type',
 regular: 'Regular',
 smart: 'Smart',
 fridgeBrand: 'Fridge Brand',
 selectBrand: 'Select brand',
 other: 'Other',
 saveChanges: 'Save Changes',
 },
 'es': {
 editProfile: 'Editar Perfil',
 changePhoto: 'Cambiar foto',
 photoUpdated: '¡Foto actualizada!',
 name: 'Nombre',
 yourName: 'Tu nombre',
 residents: 'Residentes',
 howMany: '¿Cuántos residentes?',
 person: 'persona',
 people: 'personas',
 homeType: 'Tipo de Vivienda',
 apartment: 'Apartamento',
 house: 'Casa',
 fridgeType: 'Tipo de Nevera',
 regular: 'Común',
 smart: 'Smart',
 fridgeBrand: 'Marca de Nevera',
 selectBrand: 'Selecciona marca',
 other: 'Otra',
 saveChanges: 'Guardar Cambios',
 },
 };

 const l = labels[language];

 return (
 <Sheet open={open} onOpenChange={onClose}>
 <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0">
 <SheetHeader className="border-b border-gray-200 px-6 py-4">
 <SheetTitle className="flex items-center gap-2 text-lg font-bold">
 <User className="h-5 w-5 text-primary" />
 {l.editProfile}
 </SheetTitle>
 </SheetHeader>

 <ScrollArea className="h-[calc(85vh-80px)]">
 <div className="space-y-6 px-6 py-5 pb-10">
 {/* Avatar with upload functionality */}
 <div className="flex flex-col items-center gap-3">
 <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-sm">
 <AvatarImage src={avatarUrl} alt="Avatar" />
 <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">
 {name ? name.charAt(0).toUpperCase() : 'U'}
 </AvatarFallback>
 </Avatar>
 <label htmlFor="avatar-upload">
 <input
 type="file"
 id="avatar-upload"
 accept="image/*"
 className="hidden"
 onChange={async (e) => {
 const file = e.target.files?.[0];
 if (file && user) {
 setUploadingPhoto(true);
 try {
 const fileExt = file.name.split('.').pop();
 const filePath = `${user.id}/avatar.${fileExt}`;
 
 const { error: uploadError } = await supabase.storage
 .from('avatars')
 .upload(filePath, file, { upsert: true });
 
 if (uploadError) throw uploadError;
 
 const { data: urlData } = supabase.storage
 .from('avatars')
 .getPublicUrl(filePath);
 
 const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
 setAvatarUrl(publicUrl);
 toast.success(l.photoUpdated);
 } catch (error) {
 console.error('Upload error:', error);
 // Fallback to base64
 const reader = new FileReader();
 reader.onloadend = () => {
 setAvatarUrl(reader.result as string);
 toast.success(l.photoUpdated);
 };
 reader.readAsDataURL(file);
 } finally {
 setUploadingPhoto(false);
 }
 }
 }}
 />
 <Button variant="outline" size="sm" className="gap-2 rounded-md cursor-pointer" asChild>
 <span>
 <Camera className="h-4 w-4" />
 {l.changePhoto}
 </span>
 </Button>
 </label>
 </div>

 {/* Name — blindado após primeira definição */}
 <div className="space-y-2">
 <Label className="text-sm font-semibold">{l.name}</Label>
 <Input
 placeholder={l.yourName}
 value={name}
 onChange={(e) => setName(e.target.value)}
 className="h-12 rounded-md"
 readOnly={!!onboardingData?.name}
 disabled={!!onboardingData?.name}
 />
 {!!onboardingData?.name && (
 <p className="text-xs text-muted-foreground">
 {language === 'pt-BR'
 ? 'Nome não pode ser alterado após o cadastro.'
 : language === 'es'
 ? 'El nombre no puede cambiarse después del registro.'
 : 'Name cannot be changed after signup.'}
 </p>
 )}
 </div>

 {/* Residents */}
 <div className="space-y-2">
 <Label className="flex items-center gap-2 text-sm font-semibold">
 <Users className="h-4 w-4 text-gray-500" />
 {l.residents}
 </Label>
 <Select value={residents} onValueChange={setResidents}>
 <SelectTrigger className="h-12 rounded-md">
 <SelectValue placeholder={l.howMany} />
 </SelectTrigger>
 <SelectContent>
 {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
 <SelectItem key={num} value={num.toString()}>
 {num} {num === 1 ? l.person : l.people}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 {/* Home Type */}
 <div className="space-y-2">
 <Label className="flex items-center gap-2 text-sm font-semibold">
 <Home className="h-4 w-4 text-gray-500" />
 {l.homeType}
 </Label>
 <div className="flex gap-3">
 <button
 onClick={() => setHomeType('apartment')}
 className={`flex flex-1 flex-col items-center gap-2 rounded-md border-2 p-4 transition-all active:scale-95 ${
 homeType === 'apartment'
 ? 'border-primary bg-primary/10 shadow-sm'
 : 'border-gray-200 bg-white hover:border-primary/30'
 }`}
 >
 <span className="text-2xl">🏢</span>
 <span className="text-sm font-medium">{l.apartment}</span>
 </button>
 <button
 onClick={() => setHomeType('house')}
 className={`flex flex-1 flex-col items-center gap-2 rounded-md border-2 p-4 transition-all active:scale-95 ${
 homeType === 'house'
 ? 'border-primary bg-primary/10 shadow-sm'
 : 'border-gray-200 bg-white hover:border-primary/30'
 }`}
 >
 <span className="text-2xl">🏠</span>
 <span className="text-sm font-medium">{l.house}</span>
 </button>
 </div>
 </div>

 {/* Fridge Type */}
 <div className="space-y-2">
 <Label className="flex items-center gap-2 text-sm font-semibold">
 <Refrigerator className="h-4 w-4 text-gray-500" />
 {l.fridgeType}
 </Label>
 <div className="flex gap-3">
 <button
 onClick={() => setFridgeType('regular')}
 className={`flex flex-1 flex-col items-center gap-2 rounded-md border-2 p-4 transition-all active:scale-95 ${
 fridgeType === 'regular'
 ? 'border-primary bg-primary/10 shadow-sm'
 : 'border-gray-200 bg-white hover:border-primary/30'
 }`}
 >
 <span className="text-2xl">❄️</span>
 <span className="text-sm font-medium">{l.regular}</span>
 </button>
 <button
 onClick={() => setFridgeType('smart')}
 className={`flex flex-1 flex-col items-center gap-2 rounded-md border-2 p-4 transition-all active:scale-95 ${
 fridgeType === 'smart'
 ? 'border-primary bg-primary/10 shadow-sm'
 : 'border-gray-200 bg-white hover:border-primary/30'
 }`}
 >
 <span className="text-2xl">🤖</span>
 <span className="text-sm font-medium">{l.smart}</span>
 </button>
 </div>
 </div>

 {/* Fridge Brand (if smart) */}
 {fridgeType === 'smart' && (
 <div className="space-y-2 animate-in fade-in slide-in-">
 <Label className="text-sm font-semibold">{l.fridgeBrand}</Label>
 <Select value={fridgeBrand} onValueChange={setFridgeBrand}>
 <SelectTrigger className="h-12 rounded-md">
 <SelectValue placeholder={l.selectBrand} />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="samsung">Samsung Family Hub</SelectItem>
 <SelectItem value="lg">LG ThinQ</SelectItem>
 <SelectItem value="brastemp">Brastemp Inverse</SelectItem>
 <SelectItem value="electrolux">Electrolux Smart</SelectItem>
 <SelectItem value="other">{l.other}</SelectItem>
 </SelectContent>
 </Select>
 </div>
 )}

 {/* Save Button */}
 <Button 
 onClick={handleSave}
 disabled={saving}
 className="w-full gap-2 rounded-md py-6 font-bold shadow-sm"
 >
 {saving ? (
 <Loader2 className="h-5 w-5 animate-spin" />
 ) : (
 <Save className="h-5 w-5" />
 )}
 {l.saveChanges}
 </Button>
 </div>
 </ScrollArea>
 </SheetContent>
 </Sheet>
 );
}
