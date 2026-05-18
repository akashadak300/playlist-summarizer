import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
        }

        const video = await prisma.video.findUnique({
            where: { id }
        });

        if (!video) {
            return NextResponse.json({ error: 'Video not found' }, { status: 404 });
        }

        // Send to local Python backend (assuming it runs on port 8000)
        const pyRes = await fetch('http://127.0.0.1:8000/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ video_url: `https://www.youtube.com/watch?v=${video.videoId}` })
        });

        if (!pyRes.ok) {
            throw new Error(`Python Backend Error: ${pyRes.statusText}`);
        }

        const data = await pyRes.json();

        if (!data.transcript) {
            throw new Error('No transcript returned from Whisper');
        }

        const updated = await prisma.video.update({
            where: { id },
            data: {
                transcript: data.transcript,
                status: 'transcript_fetched',
                currentStep: 'transcript_fetched',
                errorMessage: null,
                errorType: null
            }
        });

        return NextResponse.json(updated);

    } catch (e: any) {
        console.error("Whisper Transcript Error:", e);

        await prisma.video.update({
            where: { id: (await params).id },
            data: {
                status: 'error',
                errorType: 'whisper_error',
                errorMessage: e.message || 'Failed to fetch transcript via Whisper'
            }
        }).catch(() => null);

        return NextResponse.json({ error: 'Failed to fetch transcript via Whisper' }, { status: 500 });
    }
}
