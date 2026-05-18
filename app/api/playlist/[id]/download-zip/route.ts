import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import AdmZip from 'adm-zip';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const url = new URL(req.url);
        const type = url.searchParams.get('type'); // 'transcripts' or 'summaries'

        if (!id || (type !== 'transcripts' && type !== 'summaries')) {
            return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
        }

        const playlist = await prisma.playlist.findUnique({
            where: { id },
            include: { videos: true }
        });

        if (!playlist) {
            return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
        }

        const zip = new AdmZip();
        let addedCount = 0;

        for (const video of playlist.videos) {
            const safeTitle = video.title.replace(/[^a-zA-Z0-9]/g, '_');
            if (type === 'transcripts' && video.transcript) {
                zip.addFile(`${safeTitle}_transcript.txt`, Buffer.from(video.transcript, 'utf8'));
                addedCount++;
            } else if (type === 'summaries' && video.summary) {
                zip.addFile(`${safeTitle}_summary.txt`, Buffer.from(video.summary, 'utf8'));
                addedCount++;
            }
        }

        if (addedCount === 0) {
            return NextResponse.json({ error: `No ${type} available to download yet.` }, { status: 404 });
        }

        const zipBuffer = zip.toBuffer();

        return new NextResponse(zipBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="playlist_${type}.zip"`,
            },
        });
    } catch (e: any) {
        console.error("ZIP Error:", e);
        return NextResponse.json({ error: 'Failed to generate ZIP' }, { status: 500 });
    }
}
