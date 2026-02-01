import { Upload, Camera, Keyboard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type InputMethod = "upload" | "camera" | "manual";

interface InputMethodSelectorProps {
  onSelect: (method: InputMethod) => void;
}

export function InputMethodSelector({ onSelect }: InputMethodSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Como quer inserir a lista?
        </h2>
        <p className="mt-2 text-muted-foreground">
          Escolha a forma mais prática para você
        </p>
      </div>

      <div className="space-y-3">
        <Card
          className="cursor-pointer border-2 transition-all hover:border-primary hover:shadow-md"
          onClick={() => onSelect("upload")}
        >
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <Upload className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Enviar arquivo</h3>
              <p className="text-sm text-muted-foreground">
                PDF ou imagem da lista (a IA extrai os itens)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer border-2 transition-all hover:border-secondary hover:shadow-md"
          onClick={() => onSelect("camera")}
        >
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary/10">
              <Camera className="h-7 w-7 text-secondary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Tirar foto</h3>
              <p className="text-sm text-muted-foreground">
                Use a câmera para fotografar a lista agora
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer border-2 transition-all hover:border-accent hover:shadow-md"
          onClick={() => onSelect("manual")}
        >
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10">
              <Keyboard className="h-7 w-7 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Digitar itens</h3>
              <p className="text-sm text-muted-foreground">
                Insira os itens manualmente um por um
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
