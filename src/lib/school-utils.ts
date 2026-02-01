/**
 * Utility functions for school data display
 */

/**
 * Cleans school name by removing leading codes/IDs
 * Examples:
 * - "01004 - CRECHE CANTINHO FELIZ" -> "Creche Cantinho Feliz"
 * - "0101001 EM VICENTE LICINIO CARDOSO" -> "EM Vicente Licinio Cardoso"
 * - "ESCOLA MUNICIPAL TESTE" -> "Escola Municipal Teste"
 */
export function cleanSchoolName(name: string): string {
  if (!name) return "";
  
  // Remove leading numeric codes (with or without dash/separator)
  // Patterns: "01004 - ", "0101001 ", "01004- ", etc.
  let cleaned = name.replace(/^\d+\s*[-–—]?\s*/, "");
  
  // Title case the result for better readability
  cleaned = toTitleCase(cleaned);
  
  return cleaned;
}

/**
 * Converts a string to title case, with special handling for common abbreviations
 */
function toTitleCase(str: string): string {
  // Common abbreviations that should stay uppercase
  const abbreviations = new Set([
    "EM", "EE", "EEF", "EEEF", "EMEF", "EMEI", "CEMEI", "CEI", "CIEP", "CM",
    "CEEJA", "APAE", "SESI", "SENAI", "SENAC", "SESC", "IF", "IFRO", "UFRO",
    "CTPM", "CEJA", "CEDUC", "CAIC", "CAE", "AISS", "AMA", "RO", "RJ", "SP",
    "MG", "RS", "PR", "SC", "BA", "PE", "CE", "PA", "MA", "GO", "MT", "MS",
    "DF", "ES", "PB", "RN", "AL", "SE", "PI", "AC", "AM", "AP", "RR", "TO"
  ]);
  
  // Words that should stay lowercase (unless first word)
  const lowercaseWords = new Set([
    "de", "da", "do", "das", "dos", "e", "em", "com", "para", "por"
  ]);
  
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      const upperWord = word.toUpperCase();
      
      // Check if it's a known abbreviation
      if (abbreviations.has(upperWord)) {
        return upperWord;
      }
      
      // Check if it should be lowercase (except first word)
      if (index > 0 && lowercaseWords.has(word)) {
        return word;
      }
      
      // Handle apostrophes (D'Oeste -> D'Oeste)
      if (word.includes("'")) {
        return word
          .split("'")
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join("'");
      }
      
      // Regular title case
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}
