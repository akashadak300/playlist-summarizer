import { google } from 'googleapis';

const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY, // Ensure this is set in your .env
});

export function extractPlaylistId(url: string): string | null {
    try {
        const parsedUrl = new URL(url);
        if (parsedUrl.hostname.includes('youtube.com') || parsedUrl.hostname.includes('youtu.be')) {
            return parsedUrl.searchParams.get('list');
        }
        return null;
    } catch (e) {
        return null;
    }
}

export interface VideoMetadata {
    videoId: string;
    title: string;
    duration: number; // in seconds
    thumbnailUrl?: string;
}

export interface PlaylistMetadata {
    title: string;
    videos: VideoMetadata[];
}

function parseISO8601Duration(duration: string): number {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);

    if (!match) return 0;

    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;

    return hours * 3600 + minutes * 60 + seconds;
}


export async function fetchPlaylistMetadata(playlistId: string): Promise<PlaylistMetadata> {
    // Fetch playlist title
    const playlistResponse = await youtube.playlists.list({
        part: ['snippet'],
        id: [playlistId],
    });

    if (!playlistResponse.data.items || playlistResponse.data.items.length === 0) {
        throw new Error('Playlist not found.');
    }

    const title = playlistResponse.data.items[0].snippet?.title || 'Unknown Playlist';

    // Fetch playlist items
    let videos: VideoMetadata[] = [];
    let nextPageToken: string | null | undefined = undefined;

    do {
        const playlistItemsResponse: any = await youtube.playlistItems.list({
            part: ['snippet'],
            playlistId,
            maxResults: 30, // Get up to 30 per page or limit
            pageToken: nextPageToken || undefined,
        });

        const items = playlistItemsResponse.data.items || [];

        // Check limit
        if (videos.length + items.length > 30) {
            throw new Error('Playlist has more than 30 videos. We currently only support up to 30 videos per playlist.');
        }

        const videoIds = items.map((item: any) => item.snippet?.resourceId?.videoId).filter(Boolean) as string[];

        if (videoIds.length > 0) {
            // Fetch duration for these videos
            const videoResponse = await youtube.videos.list({
                part: ['contentDetails'],
                id: videoIds,
            });

            const durationMap = new Map<string, number>();

            videoResponse.data.items?.forEach(vid => {
                if (vid.id && vid.contentDetails?.duration) {
                    durationMap.set(vid.id, parseISO8601Duration(vid.contentDetails.duration));
                }
            });

            items.forEach((item: any) => {
                const videoId = item.snippet?.resourceId?.videoId;
                if (videoId) {
                    const thumbs = item.snippet?.thumbnails;
                    const thumbnailUrl = thumbs?.maxres?.url || thumbs?.high?.url || thumbs?.medium?.url || thumbs?.default?.url;

                    videos.push({
                        videoId,
                        title: item.snippet?.title || 'Unknown Video',
                        duration: durationMap.get(videoId) || 0,
                        thumbnailUrl
                    });
                }
            });
        }

        nextPageToken = playlistItemsResponse.data.nextPageToken;

        // Stop early if we hit 30, though the check above handles exceeding it
        if (videos.length >= 30) break;

    } while (nextPageToken);

    return { title, videos };
}
