/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_INFURA_KEY: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
