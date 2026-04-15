import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
const sparseMatrixShimPath = fileURLToPath(new URL("./src/vendor/ml-sparse-matrix.ts", import.meta.url));
const nmrSimulationSourcePath = fileURLToPath(new URL("./node_modules/nmr-simulation/src/index.js", import.meta.url));
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            util: "util/",
            "ml-sparse-matrix": sparseMatrixShimPath,
            "nmr-simulation": nmrSimulationSourcePath,
        },
    },
    build: {
        chunkSizeWarningLimit: 1200,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes("openchemlib")) {
                        return "chem-engine";
                    }
                    if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
                        return "react-vendor";
                    }
                    if (id.includes("nmr-predictor")
                        || id.includes("nmr-simulation")
                        || id.includes("ml-matrix")
                        || id.includes("ml-hclust")
                        || id.includes("ml-stat")
                        || id.includes("ml-simple-clustering")
                        || id.includes("ml-distance")
                        || id.includes("ml-array")
                        || id.includes("binary-search")
                        || id.includes("num-sort")
                        || id.includes("new-array")) {
                        return "nmr-vendor";
                    }
                    return undefined;
                },
            },
        },
    },
    server: {
        host: "0.0.0.0",
        port: 4173,
    },
});
