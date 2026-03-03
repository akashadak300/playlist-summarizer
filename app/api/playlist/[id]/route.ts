import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: 'Playlist ID is required' },
                { status: 400 }
            );
        }

        const playlist = await prisma.playlist.findUnique({
            where: { id },
            include: {
                videos: {
                    orderBy: {
                        orderIndex: 'asc' // exact YouTube playlist order
                    }
                }
            }
        });

        if (!playlist) {
            return NextResponse.json(
                { error: 'Playlist not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            title: playlist.title,
            status: playlist.status,
            processedVideos: playlist.processedVideos,
            totalVideos: playlist.totalVideos,
            videos: playlist.videos.map(vid => ({
                id: vid.id,
                title: vid.title,
                duration: vid.duration,
                status: vid.status,
                currentStep: vid.currentStep,
                errorMessage: vid.errorMessage,
                errorType: vid.errorType,
                thumbnail: vid.thumbnail,
                orderIndex: vid.orderIndex,
                hasTranscript: !!vid.transcript,
                summary: vid.summary,
                modelUsed: vid.modelUsed,
                createdAt: vid.createdAt.toISOString()
            }))
        });

    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch playlist status' },
            { status: 500 }
        );
    }
}
