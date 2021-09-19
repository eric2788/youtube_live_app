import { RedisClientType } from "redis/dist/lib/client";
import { RedisModules } from "redis/dist/lib/commands";
import { RedisLuaScripts } from "redis/dist/lib/lua-script";

export interface LiveRoomStatus {

    platform: 'youtube' | 'twitter' | 'twitch' | 'bilibili'
    id: string,
    status: 'started' | 'stopped' | 'error' | 'existed'

}

export type LiveStatus = 'live' | 'idle' | 'upcoming'

export interface LiveBroadcast {
    channelId: string,
    channelName: string,
    status: LiveStatus
    info?: BraodCastInfo
}

export interface BraodCastInfo {
    cover?: string,
    title: string,
    url: string,
    publishTime: Date,
    description: string
}


export type StandAloneRedisClient = RedisClientType<RedisModules, RedisLuaScripts>

export const LIVE_ROOM_STATUS_CHANNEL = "live-room-status"

export interface ChannelResponse {
    kind: string,
    etag: string,
    id: string,
    snippet: ChannelSnippet 
}

export interface ChannelSnippet {
    title: string,
    description: string,
    publishedAt: Date,
    thumbnails: Thumbails,
    country: string
}

export interface VideoSearchResponse {
    kind: string,
    etag: string,
    regionCode: string,

    items: VideoSearchItem[]
}

export interface VideoSearchItem {
    kind: string,
    etag: string,
    id: {
        kind: string,
        videoId: string
    }
    snippet: VideoSnippet
}

export interface VideoResponse {
    kind: string,
    etag: string,
    items: VideoItem[]
}

export interface VideoItem {

    kind: string,
    etag: string,
    id: string,
    snippet: VideoSnippet,
    liveStreamingDetails: LiveStreamingDetails

}

export interface VideoSnippet {

    publishedAt: Date,
    channelId: string,
    title: string,
    description: string,
    thumbnails: Thumbails,
    channelTitle: string,
    tags: string[],
    categoryId: string,
    liveBroadcastContent: 'none' | 'upcoming' | 'live',

}

export interface LiveStreamingDetails {
    actualStartTime?: Date,
    actualEndTime?: Date,
    scheduledStartTime: Date,
    scheduledEndTime?: Date,
    concurrentViewers?: number,
    activeLiveChatId: string
}

export interface Thumbails {

    [size: string]: {
        url: string,
        width: number,
        height: number
    }

}

export interface YoutubeError {
    error: {
        errors: [
            {
                domain: string,
                reason: string,
                message: string,
                locationType: string,
                location: string
            }
        ],
        code: number,
        message: string
    }
}


