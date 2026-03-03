import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { fetchTranscriptText } from '@/lib/captions';

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

        if (video.status !== 'captions_available') {
            return NextResponse.json({ error: 'Captions are not marked as available for this video. Please check captions first.' }, { status: 400 });
        }

        // 2 & 3. Fetch the parsed text from the utility
        const plainText = await fetchTranscriptText(video.videoId);

        // 4, 5, 6. Store in Video.transcript, update status & currentStep
        const updated = await prisma.video.update({
            where: { id },
            data: {
                transcript: plainText,
                status: 'transcript_fetched',
                currentStep: 'transcript_fetched',
                errorMessage: null
            }
        });

        // 7. Return success
        return NextResponse.json(updated);

    } catch (e: any) {
        console.error("DEBUG transcript error:", e);

        await prisma.video.update({
            where: { id: (await params).id },
            data: {
                status: 'error',
                errorMessage: e.message || 'Failed to fetch and parse transcript'
            }
        }).catch(() => null);

        return NextResponse.json({ error: 'Failed to fetch transcript' }, { status: 500 });
    }
}
