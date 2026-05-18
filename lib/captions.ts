import youtubedl from 'youtube-dl-exec';

export async function checkCaptionsAvailability(videoId: string): Promise<boolean> {
    const output = await youtubedl(`https://www.youtube.com/watch?v=${videoId}`, {
        dumpJson: true,
        skipDownload: true,
        writeAutoSub: true,
        writeSub: true,
        subLang: 'en',
        forceIpv4: true,
        jsRuntimes: 'node'
    }) as any;

    const manualSubs = output.subtitles || {};
    const autoSubs = output.automatic_captions || {};

    // Check if English exists in either subtitles map
    const enSub = manualSubs.en || autoSubs.en || autoSubs['en-orig'];

    return !!enSub;
}

export async function fetchTranscriptText(videoId: string): Promise<string> {
    const output = await youtubedl(`https://www.youtube.com/watch?v=${videoId}`, {
        dumpJson: true,
        skipDownload: true,
        writeAutoSub: true,
        writeSub: true,
        subLang: 'en',
        forceIpv4: true,
        jsRuntimes: 'node'
    }) as any;

    const manualSubs = output.subtitles || {};
    const autoSubs = output.automatic_captions || {};
    const enSub = manualSubs.en || autoSubs.en || autoSubs['en-orig'];

    if (!enSub || !enSub.length) {
        throw new Error("No English captions returned from YouTube");
    }

    // Identify JSON3 endpoint
    const subUrl = enSub.find((s: any) => s.ext === 'json3')?.url || enSub[0].url;

    // Fetch and parse the raw caption blocks
    const sRes = await fetch(subUrl);
    const sJson = await sRes.json();

    const plainText = sJson.events
        ? sJson.events.map((e: any) => e.segs ? e.segs.map((s: any) => s.utf8).join('') : '').join(' ').replace(/\n/g, ' ')
        : '';

    if (!plainText.trim()) throw new Error("Parsed empty transcript string");

    return plainText;
}
