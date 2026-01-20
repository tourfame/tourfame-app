/**
 * JSON Fixer - Attempts to repair malformed JSON strings
 * Handles common issues like unterminated strings, missing brackets, etc.
 */

/**
 * Extract JSON from text that may contain additional content
 * @param text - Text that may contain JSON
 * @returns Extracted JSON string or original text
 */
export function extractJSON(text: string): string {
  // Try to find JSON array or object
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return arrayMatch[0];
  }
  
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    return objectMatch[0];
  }
  
  return text;
}

/**
 * Fix common JSON syntax errors
 * @param jsonString - Potentially malformed JSON string
 * @returns Fixed JSON string
 */
export function fixJSON(jsonString: string): string {
  let fixed = jsonString;
  
  // Remove any content before the first [ or {
  const firstBracket = Math.min(
    fixed.indexOf('[') >= 0 ? fixed.indexOf('[') : Infinity,
    fixed.indexOf('{') >= 0 ? fixed.indexOf('{') : Infinity
  );
  if (firstBracket !== Infinity && firstBracket > 0) {
    fixed = fixed.substring(firstBracket);
  }
  
  // Remove any content after the last ] or }
  const lastBracket = Math.max(
    fixed.lastIndexOf(']'),
    fixed.lastIndexOf('}')
  );
  if (lastBracket >= 0 && lastBracket < fixed.length - 1) {
    fixed = fixed.substring(0, lastBracket + 1);
  }
  
  // Fix unterminated strings by adding closing quotes before special characters
  // This is a heuristic approach and may not work for all cases
  fixed = fixed.replace(/("[^"]*)([\n\r])/g, '$1"$2');
  
  // Fix missing commas between array elements or object properties
  fixed = fixed.replace(/"\s*\n\s*"/g, '",\n"');
  fixed = fixed.replace(/}\s*\n\s*{/g, '},\n{');
  fixed = fixed.replace(/]\s*\n\s*\[/g, '],\n[');
  
  // Fix trailing commas (not allowed in JSON)
  fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
  
  // Fix missing closing brackets
  const openBrackets = (fixed.match(/\[/g) || []).length;
  const closeBrackets = (fixed.match(/\]/g) || []).length;
  if (openBrackets > closeBrackets) {
    fixed += ']'.repeat(openBrackets - closeBrackets);
  }
  
  const openBraces = (fixed.match(/\{/g) || []).length;
  const closeBraces = (fixed.match(/\}/g) || []).length;
  if (openBraces > closeBraces) {
    fixed += '}'.repeat(openBraces - closeBraces);
  }
  
  return fixed;
}

/**
 * Try multiple strategies to parse JSON
 * @param text - Text containing JSON
 * @returns Parsed JSON object or null if all strategies fail
 */
export function parseJSONWithFallback(text: string): any {
  const strategies = [
    // Strategy 1: Direct parse
    () => JSON.parse(text),
    
    // Strategy 2: Extract and parse
    () => JSON.parse(extractJSON(text)),
    
    // Strategy 3: Fix and parse
    () => JSON.parse(fixJSON(text)),
    
    // Strategy 4: Extract, fix, and parse
    () => JSON.parse(fixJSON(extractJSON(text))),
    
    // Strategy 5: Remove control characters and parse
    () => JSON.parse(text.replace(/[\x00-\x1F\x7F-\x9F]/g, '')),
    
    // Strategy 6: Try json5 (more lenient parser)
    () => {
      // Fallback: try to extract key-value pairs manually
      const extracted: any[] = [];
      const tourRegex = /"title"\s*:\s*"([^"]*)"/g;
      let match;
      while ((match = tourRegex.exec(text)) !== null) {
        // This is a very basic extraction, real implementation would be more complex
        extracted.push({ title: match[1] });
      }
      return extracted.length > 0 ? extracted : null;
    }
  ];
  
  for (let i = 0; i < strategies.length; i++) {
    try {
      const result = strategies[i]();
      if (result !== null) {
        return result;
      }
    } catch (error) {
      // Continue to next strategy
      continue;
    }
  }
  
  return null;
}

/**
 * Validate and sanitize extracted tour data
 * @param data - Raw data from LLM
 * @returns Validated and sanitized tour data array
 */
export function validateTourData(data: any): any[] {
  if (!Array.isArray(data)) {
    // If it's a single object, wrap it in an array
    if (typeof data === 'object' && data !== null) {
      data = [data];
    } else {
      return [];
    }
  }
  
  return data.filter((tour: any) => {
    // Must have at least title and destination
    return tour && 
           typeof tour === 'object' && 
           tour.title && 
           typeof tour.title === 'string' &&
           tour.title.trim().length > 0;
  }).map((tour: any) => {
    // Sanitize and provide defaults
    return {
      title: String(tour.title || '').trim(),
      destination: String(tour.destination || '').trim(),
      days: parseInt(tour.days) || 0,
      nights: parseInt(tour.nights) || 0,
      price: parseFloat(tour.price) || 0,
      departureDate: tour.departureDate || '',
      highlights: Array.isArray(tour.highlights) ? tour.highlights : [],
      phone: String(tour.phone || '').trim(),
      whatsapp: String(tour.whatsapp || '').trim(),
      imageUrl: String(tour.imageUrl || '').trim()
    };
  });
}
