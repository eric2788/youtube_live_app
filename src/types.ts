import { RedisClientType } from "redis/dist/lib/client";
import { RedisModules } from "redis/dist/lib/commands";
import { RedisLuaScripts } from "redis/dist/lib/lua-script";

export interface LiveRoomStatus {

    channelId: string,
    status: 'started' | 'stopped' | 'error'

}


export interface LiveBroadcast {
    channelId: string,
    info?: BraodCastInfo
}

export interface BraodCastInfo {
    cover?: string,
    channelName: string,
    title: string,
    url: string,
    publishTime: Date,
    description: string
}


export type StandAloneRedisClient = RedisClientType<RedisModules, RedisLuaScripts>

export const LIVE_ROOM_STATUS_CHANNEL = "yt-live-status"