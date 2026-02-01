import { useState, useRef, useEffect } from "react";
import { Search, MapPin, Loader2, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCepSuggestions } from "@/hooks/use-cep-suggestions";
import { formatCep, normalizeCep } from "@/lib/school-utils";
import { cn } from "@/lib/utils";

interface CepAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (cep: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
}

export function CepAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Digite o CEP (ex: 01003-001)",
  className,
  inputClassName,
  disabled = false,
}: CepAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { suggestions, isLoading } = useCepSuggestions({
    prefix: value,
    enabled: isOpen && value.length >= 2,
    maxResults: 6,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset highlight when suggestions change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [suggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    onChange(formatted);
    setIsOpen(true);
  };

  const handleSelect = (cep: string) => {
    const formatted = formatCep(cep);
    onChange(formatted);
    onSelect?.(cep);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === "ArrowDown" && value.length >= 2) {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleSelect(suggestions[highlightedIndex].cep);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const showDropdown = isOpen && (suggestions.length > 0 || isLoading) && normalizeCep(value).length >= 2;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={9}
          disabled={disabled}
          className={cn(
            "pr-10",
            inputClassName
          )}
          role="combobox"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-autocomplete="list"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <Search className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div 
          className="absolute top-full left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border border-border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95"
          role="listbox"
        >
          {isLoading && suggestions.length === 0 ? (
            <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Buscando sugestões...
            </div>
          ) : (
            <ul className="max-h-[280px] overflow-auto py-1">
              {suggestions.map((suggestion, index) => (
                <li
                  key={suggestion.cep}
                  role="option"
                  aria-selected={highlightedIndex === index}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors",
                    highlightedIndex === index
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted"
                  )}
                  onClick={() => handleSelect(suggestion.cep)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {suggestion.formattedCep}
                      </span>
                      {suggestion.search_count > 0 && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          Popular
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {suggestion.city && suggestion.state && (
                        <span>{suggestion.city}, {suggestion.state}</span>
                      )}
                      {suggestion.school_count > 0 && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {suggestion.school_count} escola{suggestion.school_count !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
