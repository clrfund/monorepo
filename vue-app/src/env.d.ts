/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_INFURA_KEY: string
	readonly VITE_ETHEREUM_API_URL: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
