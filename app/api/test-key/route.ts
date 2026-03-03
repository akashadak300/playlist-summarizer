import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { model, apiKey } = body;

        if (!model || !apiKey) {
            return NextResponse.json(
                { valid: false, error: 'Model and API key are required' },
                { status: 400 }
            );
        }

        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'Playlist Summarizer'
            },
            body: JSON.stringify({
                model: model, // uses exactly what was passed from grouped dropdown selection e.g 'google/gemma-3-12b-it:free'
                messages: [{ role: 'user', content: 'Say OK' }],
                max_tokens: 5
            })
        });

        if (res.ok) {
            return NextResponse.json({ valid: true });
        }

        if (res.status === 401) {
            return NextResponse.json({ valid: false, error: 'Invalid API key' });
        }

        if (res.status === 429) {
            return NextResponse.json({ valid: false, error: 'Rate limit exceeded' });
        }

        // Generic error fallback, read json message if possible
        const errorData = await res.json().catch(() => ({}));
        const message = errorData.error?.message || 'Failed to validate API key';

        return NextResponse.json({ valid: false, error: message });
    } catch (e) {
        // Intentionally not logging full error to avoid key leakage in stack traces if any
        return NextResponse.json(
            { valid: false, error: 'Network error during validation' },
            { status: 500 }
        );
    }
}
