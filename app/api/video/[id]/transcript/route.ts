import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
        }

        const video = await prisma.video.findUnique({
            where: { id },
            select: { transcript: true, status: true, errorMessage: true }
        });

        if (!video) {
            return NextResponse.json({ error: 'Video not found' }, { status: 404 });
        }

        return NextResponse.json({ transcript: video.transcript || 'No transcript saved.', status: video.status });

    } catch (e: any) {
        return NextResponse.json({ error: 'Failed to fetch transcript details' }, { status: 500 });
    }
}
