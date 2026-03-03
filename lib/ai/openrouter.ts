interface SummarizeParams {
    model: string;
    apiKey: string;
    systemPrompt?: string;
    userPrompt: string;
    transcript: string;
}

export async function summarize({
    model,
    apiKey,
    systemPrompt = 'You are a helpful assistant that summarizes transcripts.',
    userPrompt,
    transcript,
}: SummarizeParams): Promise<string> {
    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `${userPrompt}\n\n<transcript>\n${transcript}\n</transcript>` }
    ];

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
            messages,
            // you could potentially add other parameters like temperature here if desired
        })
    });

    if (!res.ok) {
        let errorMsg = 'Failed to generate summary with OpenRouter';
        try {
            const errorData = await res.json();
            if (errorData.error && errorData.error.message) {
                errorMsg = errorData.error.message;
            } else if (res.status === 401) {
                errorMsg = 'Invalid OpenRouter API Key';
            } else if (res.status === 429) {
                errorMsg = 'OpenRouter Rate Limit Exceeded';
            }
        } catch (e) {
            // Ignored if JSON parsing fails
        }
        throw new Error(errorMsg);
    }

    const data = await res.json();

    // Normalize the response text
    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        return data.choices[0].message.content;
    }

    throw new Error('Unexpected response format from OpenRouter');
}
