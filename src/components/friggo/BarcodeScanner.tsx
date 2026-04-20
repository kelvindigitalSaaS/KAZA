/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Camera, X, Keyboard, Loader2 } from "lucide-react";
import { useKaza } from "@/contexts/FriggoContext";
import { ItemCategory, ItemLocation } from "@/types/friggo";
import { toast } from "sonner";
import { isNative } from "@/lib/capacitor";

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
}

// Quick-add chips — just for the visual shortcut bar
type ProductInfo = {
  name: string;
  category: ItemCategory;
  unit: string;
  expirationDays: number;
};

const QUICK_PRODUCTS: Record<string, ProductInfo> = {
  "7891000100103": {
    name: "Leite Integral",
    category: "dairy",
    unit: "litros",
    expirationDays: 7
  },
  "7891000315507": {
    name: "Nescau",
    category: "pantry",
    unit: "unidades",
    expirationDays: 180
  },
  "7891910000197": {
    name: "Arroz Tipo 1",
    category: "pantry",
    unit: "kg",
    expirationDays: 365
  },
  "7896036093085": {
    name: "Feijão Carioca",
    category: "pantry",
    unit: "kg",
    expirationDays: 365
  },
  "7891024130100": {
    name: "Óleo de Soja",
    category: "pantry",
    unit: "litros",
    expirationDays: 365
  },
  "7891149410101": {
    name: "Detergente Ypê",
    category: "cleaning",
    unit: "unidades",
    expirationDays: 730
  },
  "7896020162643": {
    name: "Papel Higiênico",
    category: "hygiene",
    unit: "unidades",
    expirationDays: 0
  },
  "7891150019881": {
    name: "Sabonete Dove",
    category: "hygiene",
    unit: "unidades",
    expirationDays: 730
  },
  "7894900010015": {
    name: "Coca-Cola",
    category: "beverage",
    unit: "litros",
    expirationDays: 180
  },
  "7891991010856": {
    name: "Iogurte Natural",
    category: "dairy",
    unit: "unidades",
    expirationDays: 14
  }
};

const EXPIRATION_BY_CATEGORY: Record<ItemCategory, number> = {
  fruit: 7,
  vegetable: 7,
  dairy: 10,
  meat: 5,
  frozen: 90,
  beverage: 90,
  pantry: 180,
  cleaning: 365,
  hygiene: 365,
  cooked: 3
};

function mapOFFProduct(p: any): ProductInfo {
  const name =
    p.product_name_pt ||
    p.product_name ||
    p.abbreviated_product_name ||
    "Produto";
  const cats: string[] = p.categories_hierarchy ?? p.categories_tags ?? [];
  let category: ItemCategory = "pantry";
  if (cats.some((c) => /beverages|drinks|boissons|refrigerante/.test(c)))
    category = "beverage";
  else if (cats.some((c) => /dairies|milk|laticin|yaourt|iogurte/.test(c)))
    category = "dairy";
  else if (cats.some((c) => /meats|poultry|fish|seafood|carnes|frango/.test(c)))
    category = "meat";
  else if (cats.some((c) => /\bfruits\b|frutas/.test(c))) category = "fruit";
  else if (cats.some((c) => /vegetables|legumes/.test(c)))
    category = "vegetable";
  else if (cats.some((c) => /frozen/.test(c))) category = "frozen";
  else if (cats.some((c) => /cleaning/.test(c))) category = "cleaning";
  else if (cats.some((c) => /hygiene|cosmetics|beauty/.test(c)))
    category = "hygiene";
  const qty: string = p.quantity ?? "";
  const unit = /\bml\b|\bl\b|litro/i.test(qty) ? "litros" : "unidades";
  return {
    name,
    category,
    unit,
    expirationDays: EXPIRATION_BY_CATEGORY[category]
  };
}

export function BarcodeScanner({ open, onClose }: BarcodeScannerProps) {
  const { addItem } = useKaza();
  const [mode, setMode] = useState<"camera" | "manual">("manual");
  const [barcode, setBarcode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [foundProduct, setFoundProduct] = useState<ProductInfo | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [location, setLocation] = useState<ItemLocation>("fridge");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const locations: { value: ItemLocation; label: string }[] = [
    { value: "fridge", label: "Geladeira" },
    { value: "freezer", label: "Freezer" },
    { value: "pantry", label: "Dispensa" },
    { value: "cleaning", label: "Área de Limpeza" }
  ];

  useEffect(() => {
    if (mode === "camera" && open) {
      if (isNative) {
        startNativeScan();
      } else {
        startCamera();
      }
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode, open]);

  // ─── Native barcode scanner (Capacitor MLKit) ───
  const startNativeScan = async () => {
    try {
      setIsScanning(true);
      const { BarcodeScanner: NativeScanner } = await import(
        "@capacitor-mlkit/barcode-scanning"
      );
      const { supported } = await NativeScanner.isSupported();
      if (!supported) {
        toast.error("Scanner não suportado neste dispositivo");
        setMode("manual");
        return;
      }
      const permResult = await NativeScanner.requestPermissions();
      if (permResult.camera !== "granted") {
        toast.error("Permissão de câmera negada");
        setMode("manual");
        return;
      }
      const { barcodes } = await NativeScanner.scan();
      if (barcodes.length > 0 && barcodes[0].rawValue) {
        const code = barcodes[0].rawValue;
        setBarcode(code);
        searchProduct(code);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error("[DEV] Native scan error:", error);
      toast.error("Erro ao escanear. Use o modo manual.");
      setMode("manual");
    } finally {
      setIsScanning(false);
    }
  };

  // ─── Web camera fallback ───
  const startCamera = async () => {
    try {
      setIsScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error("[DEV] Camera error:", error);
      toast.error("Não foi possível acessar a câmera");
      setMode("manual");
    } finally {
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const searchProduct = async (code: string) => {
    // 1. Fast local cache
    const local = QUICK_PRODUCTS[code];
    if (local) {
      setFoundProduct(local);
      toast.success(`Produto encontrado: ${local.name}`);
      return;
    }
    // 2. Open Food Facts — base global com +3M produtos
    if (!navigator.onLine) {
      toast.error("Sem conexão. Verifique sua internet.");
      return;
    }
    setIsLookingUp(true);
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(
          code
        )}.json`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.status === 1 && data.product) {
        const mapped = mapOFFProduct(data.product);
        setFoundProduct(mapped);
        toast.success(`Produto encontrado: ${mapped.name}`);
      } else {
        setFoundProduct(null);
        toast.error("Produto não encontrado. Cadastre manualmente.");
      }
    } catch {
      setFoundProduct(null);
      toast.error("Não foi possível buscar o produto. Tente mais tarde.");
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleBarcodeSubmit = () => {
    if (barcode.length >= 8) {
      searchProduct(barcode);
    } else {
      toast.error("Digite um código de barras válido");
    }
  };

  const handleAddProduct = () => {
    if (!foundProduct) return;

    const expirationDate =
      foundProduct.expirationDays > 0
        ? new Date(
            Date.now() + foundProduct.expirationDays * 24 * 60 * 60 * 1000
          )
        : undefined;

    addItem({
      name: foundProduct.name,
      category: foundProduct.category,
      location,
      quantity: parseFloat(quantity) || 1,
      unit: foundProduct.unit,
      addedDate: new Date(),
      expirationDate
    });

    toast.success(`${foundProduct.name} adicionado!`);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setBarcode("");
    setFoundProduct(null);
    setQuantity("1");
    setLocation("fridge");
  };

  const handleClose = () => {
    stopCamera();
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Camera className="h-5 w-5 text-primary" />
            Scanner de Produtos
          </DialogTitle>
        </DialogHeader>

        {/* Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={mode === "camera" ? "default" : "outline"}
            onClick={() => setMode("camera")}
            className="flex-1 gap-2 rounded-md"
          >
            <Camera className="h-4 w-4" />
            Câmera
          </Button>
          <Button
            variant={mode === "manual" ? "default" : "outline"}
            onClick={() => setMode("manual")}
            className="flex-1 gap-2 rounded-md"
          >
            <Keyboard className="h-4 w-4" />
            Digitar
          </Button>
        </div>

        {mode === "camera" ? (
          <div className="space-y-4">
            <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
              {(isScanning || isLookingUp) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
              )}
              {/* Scan Guide */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-16 w-48 rounded-md border-2 border-dashed border-primary/70" />
              </div>
            </div>
            <p className="text-center text-sm text-gray-500">
              Posicione o código de barras dentro da área
            </p>

            {/* Manual input fallback */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Ou digite o código:
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="7891000100103"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="flex-1 rounded-md"
                />
                <Button onClick={handleBarcodeSubmit} className="rounded-md">
                  Buscar
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Código de Barras</Label>
              <Input
                placeholder="Ex: 7891000100103"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleBarcodeSubmit()}
                className="h-12 rounded-md text-center text-lg tracking-widest"
              />
            </div>
            <Button
              onClick={handleBarcodeSubmit}
              className="w-full rounded-md py-5"
              disabled={barcode.length < 8}
            >
              Buscar Produto
            </Button>

            {/* Common Products Quick Add */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-500">
                Produtos comuns:
              </Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(QUICK_PRODUCTS)
                  .slice(0, 6)
                  .map(([code, product]) => (
                    <button
                      key={code}
                      onClick={() => {
                        setBarcode(code);
                        searchProduct(code);
                      }}
                      className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-secondary active:scale-95"
                    >
                      {product.name}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Found Product */}
        {foundProduct && (
          <div className="space-y-4 rounded-md border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-foreground">
                  {foundProduct.name}
                </h4>
                <p className="text-sm text-gray-500">
                  {foundProduct.expirationDays > 0
                    ? `Validade: ${foundProduct.expirationDays} dias`
                    : "Sem validade"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFoundProduct(null)}
                className="h-8 w-8 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Quantidade</Label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="h-11 rounded-md"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Local</Label>
                <Select
                  value={location}
                  onValueChange={(v) => setLocation(v as ItemLocation)}
                >
                  <SelectTrigger className="h-11 rounded-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.value} value={loc.value}>
                        {loc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleAddProduct}
              className="w-full rounded-md py-5 font-bold"
            >
              Adicionar ao Estoque
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
