import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { summarizeTranscript } from '@/lib/summarize';

// Handle Next.js 14 maximum duration limits if deployed
export const maxDuration = 300; // 5 minutes

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { model, finalModel, apiKey, customPrompt } = body;

        if (!id || !model || !apiKey || !customPrompt) {
            return NextResponse.json(
                { error: 'Missing required parameters' },
                { status: 400 }
            );
        }

        const video = await prisma.video.findUnique({
            where: { id }
        });

        if (!video) {
            return NextResponse.json({ error: 'Video not found' }, { status: 404 });
        }

        if (!video.transcript) {
            return NextResponse.json({ error: 'Transcript missing or not fetched' }, { status: 400 });
        }

        // Update status to summarize start
        await prisma.video.update({
            where: { id },
            data: {
                status: 'processing',
                currentStep: 'summarizing',
                errorMessage: null
            }
        });

        // OpenRouter Summarization Route
        // Note: Progress cannot be easily streamed via a standard REST route without Server-Sent Events (SSE). 
        // We will log progress to the DB if we want, but for now, we will perform the long-running task natively 
        // and return the final summary. The frontend polling will just see 'summarizing' until it completes.

        const finalSummary = await summarizeTranscript({
            transcript: video.transcript,
            model,
            finalModel,
            apiKey,
            customPrompt
        });

        await prisma.video.update({
            where: { id },
            data: {
                summary: finalSummary,
                status: 'completed',
                currentStep: 'done',
                errorMessage: null,
                errorType: null,
                modelUsed: model,
                promptUsed: customPrompt,
                summarizedAt: new Date()
            }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Summarization error:", error);

        try {
            const { id } = await params;

            let eType = 'api_error';
            const logUpper = (error.message || '').toUpperCase();
            if (logUpper.includes('RATE-LIMITED') || logUpper.includes('429')) {
                eType = 'rate_limit';
            }

            await prisma.video.update({
                where: { id },
                data: {
                    status: 'error',
                    errorType: eType,
                    errorMessage: error.message || 'Summarization failed'
                }
            });
        } catch (e) { }

        return NextResponse.json(
            { error: error.message || 'Internal server error during summarization' },
            { status: 500 }
        );
    }
}
