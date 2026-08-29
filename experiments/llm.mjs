/**
 * One LLM call, three providers. The harness scripts are synchronous by
 * design (a run is a loop of calls that must finish in order), so every
 * provider is a shell command: `ollama run`, `claude -p`, or curl against an
 * OpenAI-compatible endpoint.
 *
 *   claude    the Claude Code CLI with the user's own login; --model takes an
 *             Anthropic model id or alias (claude-opus-5, claude-sonnet-5, haiku)
 *   ollama    a local model
 *   together  Together AI (https://api.together.ai/v1), any serverless model
 *             string from their catalog. Key from TOGETHER_API_KEY or
 *             ~/.config/proveml/together-key. Never passed on the command line.
 *
 * The prompt is sent as a single user message on every provider, because that
 * is what the CLI and ollama receive on stdin: the system text is part of it.
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

export function togetherKey() {
    if (process.env.TOGETHER_API_KEY) return process.env.TOGETHER_API_KEY;
    const file = join(homedir(), '.config', 'proveml', 'together-key');
    if (existsSync(file)) return readFileSync(file, 'utf8').trim();
    throw new Error('No Together key: set TOGETHER_API_KEY or write it to ~/.config/proveml/together-key');
}

/**
 * @param {'claude'|'ollama'|'together'} provider
 * @param {string} model
 * @param {string} prompt
 * @param {{ timeoutMs: number, tmpFile: string }} opts
 * @returns {string|null}  the response text, or null when the call failed
 *                         (the caller decides what a failed call means)
 */
export function callLLM(provider, model, prompt, { timeoutMs, tmpFile }) {
    writeFileSync(tmpFile, prompt);
    const exec = (cmd, extraEnv = {}) => execSync(cmd, {
        encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, timeout: timeoutMs,
        env: { ...process.env, ...extraEnv },
    });
    if (provider === 'ollama') {
        return exec(`ollama run ${model} --nowordwrap < "${tmpFile}" 2>/dev/null`).trim();
    }
    if (provider === 'together') {
        if (!model) throw new Error('--model is required for provider together');
        const body = `${tmpFile}.json`;
        // Reasoning models spend output tokens thinking before they answer;
        // with the endpoint's default budget the thinking alone can use it up
        // and the answer comes back empty. Give the answer room.
        writeFileSync(body, JSON.stringify({ model, max_tokens: 16384, messages: [{ role: 'user', content: prompt }] }));
        // The key goes in through the environment, not the argument list,
        // so it never shows up in `ps` or a shell history.
        const raw = exec(
            `curl -sS --fail-with-body -m ${Math.ceil(timeoutMs / 1000)} https://api.together.ai/v1/chat/completions`
            + ` -H "Authorization: Bearer $TOGETHER_API_KEY" -H "Content-Type: application/json" -d @"${body}"`,
            { TOGETHER_API_KEY: togetherKey() }
        );
        const json = JSON.parse(raw);
        if (json.error) throw new Error(`Together: ${json.error.message || JSON.stringify(json.error)}`);
        const choice = json.choices?.[0];
        const text = choice?.message?.content;
        if (typeof text !== 'string' || text.trim() === '') {
            const reasoning = (choice?.message?.reasoning_content || '').length;
            throw new Error(`Together: empty answer (finish_reason=${choice?.finish_reason}, reasoning_content=${reasoning} chars, completion_tokens=${json.usage?.completion_tokens})`);
        }
        return text.trim();
    }
    // Claude Code CLI
    return exec(`cat "${tmpFile}" | claude -p${model ? ` --model ${model}` : ''}`).trim();
}
