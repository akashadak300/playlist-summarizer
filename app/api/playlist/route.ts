import { NextResponse } from 'next/server';
import { extractPlaylistId, fetchPlaylistMetadata } from '@/lib/youtube';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { playlistUrl, model, customPrompt } = body;

        if (!playlistUrl || !model || !customPrompt) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const playlistId = extractPlaylistId(playlistUrl);

        if (!playlistId) {
            return NextResponse.json(
                { error: 'Invalid playlist URL' },
                { status: 400 }
            );
        }

        const metadata = await fetchPlaylistMetadata(playlistId);

        // Transaction insert
        const createdPlaylist = await prisma.$transaction(async (tx) => {
            const tempPlaylist = await tx.playlist.create({
                data: {
                    title: metadata.title,
                    totalVideos: metadata.videos.length,
                    status: 'processing',
                }
            });

            await tx.video.createMany({
                data: metadata.videos.map((vid, index) => ({
                    playlistId: tempPlaylist.id,
                    videoId: vid.videoId,
                    title: vid.title,
                    orderIndex: index,
                    duration: vid.duration,
                    thumbnail: vid.thumbnailUrl || null,
                    status: 'pending',
                    currentStep: 'captions_check',
                }))
            });

            return tempPlaylist;
        });

        return NextResponse.json(
            { playlistId: createdPlaylist.id },
            { status: 200 }
        );

    } catch (error: any) {
        console.error("DEBUG playlist error:", error);
        return NextResponse.json(
            { error: error?.message || 'Failed to initialize playlist' },
            { status: 500 }
        );
    }
}
