/**
 * TOON (Token-Oriented Object Notation) Types
 */

export interface ToonOptions {
  /** Delimiter between fields. Default: tab */
  delimiter?: '\t' | ',' | '|';
  /** Include item count in header. Default: true */
  includeCount?: boolean;
  /** Max chars per value before truncation. 0 = no limit. Default: 500 */
  maxValueLength?: number;
}

export const DEFAULT_TOON_OPTIONS: Required<ToonOptions> = {
  delimiter: '\t',
  includeCount: true,
  maxValueLength: 500,
};
