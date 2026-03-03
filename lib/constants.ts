// Model list fetched statically. Replace with dynamic OpenRouter model listing in future version.

export const MODEL_CONTEXT_LIMITS: Record<string, number> = {
    // Gemma
    "google/gemma-3-4b-it": 33000,
    "google/gemma-3-12b-it": 33000,
    "google/gemma-3-27b-it": 131000,
    "google/gemma-3n-e2b-it:free": 8000,
    "google/gemma-3n-e4b-it:free": 8000,
    "google/gemma-3-4b-it:free": 33000,
    "google/gemma-3-12b-it:free": 33000,
    "google/gemma-3-27b-it:free": 131000,
    // Llama
    "meta-llama/llama-3.2-3b-instruct": 131000,
    "meta-llama/llama-3.3-70b-instruct": 131000,
    "nousresearch/hermes-3-llama-3.1-405b": 131000,
    // Mistral
    "mistralai/mistral-small-24b-instruct-2501": 32000,
    "cognitivecomputations/dolphin-mistral-24b-venice-edition:free": 32000,
    // Qwen
    "qwen/qwen3-4b:free": 32000,
    "qwen/qwen3-coder:free": 32000,
    "qwen/qwen3-next-80b-a3b-instruct:free": 32000,
    // NVIDIA
    "nvidia/nemotron-3-nano-30b-a3b:free": 8000,
    "nvidia/nemotron-nano-12b-v2-vl:free": 8000,
    "nvidia/nemotron-nano-9b-v2:free": 8000,
    // OpenAI OSS
    "openai/gpt-oss-20b:free": 8000,
    "openai/gpt-oss-120b:free": 8000,
    // Arcee
    "arcee-ai/trinity-mini:free": 32000,
    "arcee-ai/trinity-large-preview:free": 32000,
    // Liquid
    "liquid/lfm-2.5-1.2b-instruct:free": 32000,
    "liquid/lfm-2.5-1.2b-thinking:free": 32000,
    // Others
    "stepfun/step-3.5-flash:free": 8000,
    "upstage/solar-pro-3:free": 8000,
    "z-ai/glm-4.5-air:free": 131000
};

export const MODEL_GROUPS = [
    {
        label: "Gemma (Google)",
        options: [
            { label: "Gemma 3 4B Instruct", value: "google/gemma-3-4b-it" },
            { label: "Gemma 3 12B Instruct", value: "google/gemma-3-12b-it" },
            { label: "Gemma 3 27B Instruct", value: "google/gemma-3-27b-it" },
            { label: "Gemma 3 2B IT", value: "google/gemma-3n-e2b-it:free" },
            { label: "Gemma 3 4B IT", value: "google/gemma-3n-e4b-it:free" },
            { label: "Gemma 3 4B IT (Balanced)", value: "google/gemma-3-4b-it:free" },
            { label: "Gemma 3 12B IT (Strong)", value: "google/gemma-3-12b-it:free" },
            { label: "Gemma 3 27B IT (Large)", value: "google/gemma-3-27b-it:free" }
        ]
    },
    {
        label: "Llama",
        options: [
            { label: "Llama 3.2 3B Instruct", value: "meta-llama/llama-3.2-3b-instruct" },
            { label: "Llama 3.3 70B Instruct", value: "meta-llama/llama-3.3-70b-instruct" },
            { label: "Hermes 3 Llama 3.1 405B", value: "nousresearch/hermes-3-llama-3.1-405b" }
        ]
    },
    {
        label: "Mistral / Mixtral",
        options: [
            { label: "Mistral Small 3.1 24B Instruct", value: "mistralai/mistral-small-24b-instruct-2501" },
            { label: "Dolphin Mistral 24B", value: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free" }
        ]
    },
    {
        label: "Qwen",
        options: [
            { label: "Qwen 3 4B", value: "qwen/qwen3-4b:free" },
            { label: "Qwen 3 Coder", value: "qwen/qwen3-coder:free" },
            { label: "Qwen 3 Next 80B", value: "qwen/qwen3-next-80b-a3b-instruct:free" }
        ]
    },
    {
        label: "NVIDIA",
        options: [
            { label: "Nemotron 3 Nano 30B", value: "nvidia/nemotron-3-nano-30b-a3b:free" },
            { label: "Nemotron Nano 12B", value: "nvidia/nemotron-nano-12b-v2-vl:free" },
            { label: "Nemotron Nano 9B", value: "nvidia/nemotron-nano-9b-v2:free" }
        ]
    },
    {
        label: "OpenAI OSS",
        options: [
            { label: "GPT OSS 20B", value: "openai/gpt-oss-20b:free" },
            { label: "GPT OSS 120B", value: "openai/gpt-oss-120b:free" }
        ]
    },
    {
        label: "Arcee",
        options: [
            { label: "Trinity Mini", value: "arcee-ai/trinity-mini:free" },
            { label: "Trinity Large Preview", value: "arcee-ai/trinity-large-preview:free" }
        ]
    },
    {
        label: "Liquid",
        options: [
            { label: "LFM 2.5 1.2B Instruct", value: "liquid/lfm-2.5-1.2b-instruct:free" },
            { label: "LFM 2.5 1.2B Thinking", value: "liquid/lfm-2.5-1.2b-thinking:free" }
        ]
    },
    {
        label: "Others",
        options: [
            { label: "Step 3.5 Flash", value: "stepfun/step-3.5-flash:free" },
            { label: "Solar Pro 3", value: "upstage/solar-pro-3:free" },
            { label: "GLM 4.5 Air", value: "z-ai/glm-4.5-air:free" }
        ]
    }
];
