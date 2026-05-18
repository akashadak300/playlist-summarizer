import { MODEL_CONTEXT_LIMITS } from './constants';

interface SummarizeParams {
    transcript: string;
    model: string;
    finalModel?: string;
    apiKey: string;
    customPrompt: string;
    onProgress?: (progressMsg: string) => void;
}

// Simple token estimate
const estimateTokens = (text: string) => Math.ceil((text.trim().split(/\s+/).length) * 1.3);

const fetchOpenRouter = async (model: string, apiKey: string, systemPrompt: string, userMessage: string) => {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'Playlist Summarizer'
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage }
            ]
        })
    });

    if (!res.ok) {
        let errorMsg = `OpenRouter API error: ${res.status}`;
        try {
            const errJson = await res.json();
            console.error("OpenRouter API raw error response:", JSON.stringify(errJson, null, 2));

            if (errJson.error) {
                if (errJson.error.metadata && errJson.error.metadata.raw) {
                    errorMsg = errJson.error.metadata.raw;
                } else if (errJson.error.message) {
                    errorMsg = errJson.error.message;
                } else {
                    errorMsg = `OpenRouter Error: ${JSON.stringify(errJson.error)}`;
                }
            }
        } catch (e) { }
        throw new Error(errorMsg);
    }

    const data = await res.json();
    if (!data.choices || data.choices.length === 0) {
        throw new Error("No response choices from OpenRouter.");
    }

    return data.choices[0].message.content.trim();
};

export const summarizeTranscript = async ({ transcript, model, finalModel, apiKey, customPrompt, onProgress }: SummarizeParams): Promise<string> => {
    const contextLimit = MODEL_CONTEXT_LIMITS[model as keyof typeof MODEL_CONTEXT_LIMITS] || 8000;
    const estTokens = estimateTokens(transcript);

    const safeLimit = Math.floor(contextLimit * 0.7);

    // Single pass
    if (estTokens < safeLimit) {
        if (onProgress) onProgress("Summarizing transcript...");
        return await fetchOpenRouter(
            model,
            apiKey,
            "You are a helpful assistant that summarizes transcripts.",
            `${customPrompt}\n\nTranscript:\n${transcript}`
        );
    }

    // Hierarchical chunking
    if (onProgress) onProgress("Transcript exceeds limit. Splitting into chunks...");

    // Split by paragraphs
    const paragraphs = transcript.split(/\n+/).filter(p => p.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = "";

    const targetChunkSize = Math.floor(contextLimit * 0.6);

    for (const para of paragraphs) {
        if (estimateTokens(currentChunk + "\n" + para) > targetChunkSize) {
            if (currentChunk.length > 0) {
                chunks.push(currentChunk.trim());
                currentChunk = para;
            } else {
                // Single paragraph is too large, force split (rare, but fallback)
                chunks.push(para.substring(0, targetChunkSize * 3)); // rough char cut
            }
        } else {
            currentChunk += (currentChunk ? "\n\n" : "") + para;
        }
    }
    if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
    }

    const intermediateSummaries: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
        if (onProgress) onProgress(`Processing chunk ${i + 1} of ${chunks.length}...`);

        // Use a slightly modified prompt for intermediate chunks
        const chunkPrompt = `Summarize the following section of a transcript. Focus on key points.\n\nTranscript Section:\n${chunks[i]}`;

        try {
            const summary = await fetchOpenRouter(
                model,
                apiKey,
                "You are an assistant summarizing transcript sections.",
                chunkPrompt
            );
            intermediateSummaries.push(summary);
        } catch (err: any) {
            throw new Error(`Failed on chunk ${i + 1}: ${err.message}`);
        }
    }

    if (onProgress) onProgress("Combining intermediate summaries...");

    // Final summarize
    const finalInput = intermediateSummaries.map((s, idx) => `Part ${idx + 1}:\n${s}`).join('\n\n');

    const finalSummary = await fetchOpenRouter(
        finalModel || model,
        apiKey,
        "You are a helpful assistant that summarizes transcripts.",
        `${customPrompt}\n\nHere are the summaries of individual parts of the transcript. Create a cohesive structured final summary.\n\n${finalInput}`
    );

    return finalSummary;
};
