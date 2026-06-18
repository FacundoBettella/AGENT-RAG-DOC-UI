#!/usr/bin/env node
/**
 * mutate.mjs — Zero-dependency mutation tester for JS/TS.
 *
 * Uso:
 *   node tools/mutate.mjs src/services/authService.ts
 *   node tools/mutate.mjs src/services/authService.ts --max 50
 *
 * Comando de test configurable (env MUTATE_TEST_CMD):
 *   Vitest (default):  npm test -- --run
 *   Jest / CRA:        MUTATE_TEST_CMD="npm test -- --watchAll=false --forceExit"
 *
 * Para cada mutante:
 *   - escribe el archivo mutado
 *   - corre los tests
 *   - si algún test falla → mutante "killed" (bien)
 *   - si todos los tests pasan → mutante "survived" (agujero en la red)
 *   - restaura el archivo original (incluso si se interrumpe)
 *
 * Salida: total, killed, survived, score %.
 * Exit code: 0 si score = 100%, 1 si hay sobrevivientes.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { execSync } from "child_process";
import { resolve } from "path";

const TEST_CMD = process.env.MUTATE_TEST_CMD ?? "npm test -- --run";

// ── Catálogo de mutaciones ─────────────────────────────────────────────────
// [descripción, regexp global, texto de reemplazo]
// Por cada match en el source se genera UN solo mutante (solo ese token cambia).
const CATALOG = [
    // Igualdad estricta
    ["=== → !==", /===/g, "!=="],
    ["!== → ===", /!==/g, "==="],
    // Comparación
    ["<= → <", /<=/g, "<"],
    [">= → >", />=/g, ">"],
    // Lógica
    ["&& → ||", /&&/g, "||"],
    ["|| → &&", /\|\|/g, "&&"],
    // Literales booleanos
    ["true → false", /\btrue\b/g, "false"],
    ["false → true", /\bfalse\b/g, "true"],
    // Aritmética básica (evita ++ -- => +=)
    ["+ → -", /(?<![+<>=!])\+(?![+=])/g, "-"],
    ["- → +", /(?<![<>=!\-])-(?![->=])/g, "+"],
    // Retorno nulo (short-circuit)
    ["return x → undefined", /\breturn (?!undefined\b)([^;{}\n][^;\n]*);/g, "return undefined;"],
];

// ── Generación de mutantes ─────────────────────────────────────────────────
function buildMutants(source) {
    const mutants = [];
    for (const [desc, pattern, rep] of CATALOG) {
        const re = new RegExp(pattern.source, "g");
        let m;
        re.lastIndex = 0;
        while ((m = re.exec(source)) !== null) {
            const mutated =
                source.slice(0, m.index) + rep + source.slice(m.index + m[0].length);
            if (mutated !== source) {
                mutants.push({ desc, mutated, offset: m.index });
            }
        }
    }
    return mutants;
}

// ── Runner de tests ────────────────────────────────────────────────────────
function runTests() {
    try {
        execSync(TEST_CMD, { stdio: "pipe", timeout: 120_000 });
        return true;  // tests pasaron → mutante SURVIVED (malo)
    } catch {
        return false; // tests fallaron → mutante KILLED (bien)
    }
}

// ── Main ───────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help")) {
    console.log(
        "Uso: node tools/mutate.mjs <archivo.ts|tsx|js|jsx> [--max N]\n" +
        "\nOpciones:\n" +
        "  --max N   limitar a N mutantes (útil para pruebas rápidas)\n" +
        "\nVariables de entorno:\n" +
        "  MUTATE_TEST_CMD   comando para correr los tests\n" +
        "                    default: 'npm test -- --run'  (Vitest)\n" +
        "                    CRA/Jest: 'npm test -- --watchAll=false --forceExit'"
    );
    process.exit(0);
}

const filePath = resolve(args[0]);
if (!existsSync(filePath)) {
    console.error(`[ERROR] No existe el archivo: ${filePath}`);
    process.exit(1);
}

const maxIdx = args.indexOf("--max");
const maxMutants = maxIdx !== -1 ? parseInt(args[maxIdx + 1], 10) : Infinity;

const originalSrc = readFileSync(filePath, "utf8");
const allMutants = buildMutants(originalSrc);
const mutants = isFinite(maxMutants) ? allMutants.slice(0, maxMutants) : allMutants;

const bar = "─".repeat(50);
console.log(`\n── Prueba de mutación: ${args[0]}`);
console.log(`   Mutantes: ${mutants.length} (de ${allMutants.length} generados)`);
console.log(`   Comando:  ${TEST_CMD}\n`);

let killed = 0;
const survived = [];

try {
    for (let i = 0; i < mutants.length; i++) {
        const { desc, mutated } = mutants[i];
        const label = `[${String(i + 1).padStart(4)}/${mutants.length}] ${desc.padEnd(28)} `;
        process.stdout.write(label);
        writeFileSync(filePath, mutated, "utf8");

        if (!runTests()) {
            killed++;
            process.stdout.write("killed\n");
        } else {
            survived.push({ n: i + 1, desc });
            process.stdout.write("SURVIVED ⚠\n");
        }
    }
} finally {
    writeFileSync(filePath, originalSrc, "utf8");
    console.log("\n[restored] Archivo original restaurado.");
}

const total = mutants.length;
const score = total === 0 ? 100 : Math.round((killed / total) * 100);

console.log(`\n── Resultado ${bar}`);
console.log(`   Total:    ${total}`);
console.log(`   Killed:   ${killed}`);
console.log(`   Survived: ${survived.length}`);
console.log(`   Score:    ${score}%`);

if (survived.length > 0) {
    console.log(`\n── Mutantes sobrevivientes ${bar}`);
    for (const { n, desc } of survived) {
        console.log(`   [${n}] ${desc}`);
    }
}

process.exit(score < 100 ? 1 : 0);
