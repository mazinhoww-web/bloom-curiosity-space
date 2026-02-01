import { Camera, FileUp, PenLine } from "lucide-react";

type InputMethod = "upload" | "camera" | "manual";

interface InputMethodSelectorProps {
  onSelect: (method: InputMethod) => void;
}

export function InputMethodSelector({ onSelect }: InputMethodSelectorProps) {
  const methods = [
    {
      id: "camera" as InputMethod,
      icon: Camera,
      title: "Fotografar lista",
      description: "Use a câmera do celular para capturar a lista",
      color: "primary",
    },
    {
      id: "upload" as InputMethod,
      icon: FileUp,
      title: "Enviar arquivo",
      description: "PDF, imagem, Word ou Excel",
      color: "secondary",
    },
    {
      id: "manual" as InputMethod,
      icon: PenLine,
      title: "Digitar manualmente",
      description: "Adicione cada item da lista",
      color: "accent",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="font-display text-xl font-bold text-foreground">
          Como você quer enviar?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Escolha a forma mais fácil para você
        </p>
      </div>

      <div className="grid gap-3">
        {methods.map((method) => {
          const Icon = method.icon;
          return (
            <button
              key={method.id}
              onClick={() => onSelect(method.id)}
              className="flex items-center gap-4 rounded-xl border-2 border-transparent bg-muted/50 p-4 text-left transition-all hover:border-primary hover:bg-muted"
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-${method.color}/10`}
              >
                <Icon className={`h-6 w-6 text-${method.color}`} />
              </div>
              <div>
                <p className="font-medium text-foreground">{method.title}</p>
                <p className="text-sm text-muted-foreground">{method.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
