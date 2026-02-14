/**
 * TOON (Token-Oriented Object Notation) Types
 */

export interface ToonOptions {
  /** Delimiter between fields. Default: tab */
  delimiter?: '\t' | ',' | '|';
  /** Include item count in header. Default: true */
  includeCount?: boolean;
}

export const DEFAULT_TOON_OPTIONS: Required<ToonOptions> = {
  delimiter: '\t',
  includeCount: true,
};
