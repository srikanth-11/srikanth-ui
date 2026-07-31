export interface PropRow { name: string; type: string; default?: string; description: string }
export interface DocExport { name: string; props: PropRow[] }
export interface DocExample { title: string; code: string }
export interface KeyRow { keys: string; action: string }
export interface ComponentDoc {
  exports: DocExport[]          // >=1, first is the main component
  examples: DocExample[]        // >=1
  errorState?: string           // prose; pairs with InvalidDemo when present
  keyboard?: KeyRow[]
}
