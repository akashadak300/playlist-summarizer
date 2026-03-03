import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkCaptionsAvailability } from '@/lib/captions';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
        }

        // 1. Fetch videoId from DB
        const video = await prisma.video.findUnique({
            where: { id }
        });

        if (!video) {
            return NextResponse.json({ error: 'Video not found' }, { status: 404 });
        }

        // Update to checking state temporarily
        await prisma.video.update({
            where: { id },
            data: { status: 'checking_captions', errorMessage: null }
        });

        try {
            // 2. Call our unified lib/captions utility
            const isAvailable = await checkCaptionsAvailability(video.videoId);

            if (isAvailable) {
                // 4 & 5. Update success states
                const updated = await prisma.video.update({
                    where: { id },
                    data: {
                        status: 'captions_available',
                        currentStep: 'captions_available',
                        errorMessage: null
                    }
                });
                return NextResponse.json(updated);
            }
        } catch (capErr: any) {
            // 4. Update Video status indicating no captions or error parsing.
            // Usually ytdl / captions scrapers will throw 'Could not find captions for x'
            const isNone = capErr.message?.includes('find captions') || capErr.message?.includes('disabled');

            const errStr = capErr && capErr.message ? capErr.message : String(capErr) + ' | ' + JSON.stringify(capErr);

            const updated = await prisma.video.update({
                where: { id },
                data: {
                    status: isNone ? 'no_captions' : 'error',
                    currentStep: isNone ? 'no_captions' : 'captions_check',
                    errorMessage: isNone ? null : ('YDL_ERR: ' + errStr.substring(0, 300))
                }
            });

            return NextResponse.json(updated);
        }

        // Fallback catch if loop escaped successfully but length was 0 natively
        const finalUpdate = await prisma.video.update({
            where: { id },
            data: {
                status: 'no_captions',
                currentStep: 'no_captions'
            }
        });

        return NextResponse.json(finalUpdate);

    } catch (e: any) {
        // Broad network failure handler
        const errVideo = await prisma.video.update({
            where: { id: (await params).id },
            data: {
                status: 'error',
                errorMessage: e.message || 'Failed connecting to server.'
            }
        }).catch(() => null);

        return NextResponse.json({ error: 'Failed to verify captions', data: errVideo }, { status: 500 });
    }
}
