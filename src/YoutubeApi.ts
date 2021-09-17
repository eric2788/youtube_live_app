import axios from 'axios'
import { Channel, Video, YouTube } from 'popyt'
import data from '../config/config.json'

const API_KEY = data.api.key

const NOT_LIVING_KEYWORD = data.checker.not_live_keyword

const youtubeApi = new YouTube(API_KEY, undefined, { cacheSearches: false }, 'zh-TW', 'HK')

// only 100 times per day
export async function getLiveStreamVideo(channel: string): Promise<Video | undefined> {
    try {
        const {results: videos} = await youtubeApi.searchVideos('', 1, undefined, 'video', channel, undefined, 'live')
        if (!videos.length){
            console.warn(`Cannot find any living video from ${channel}`)
        }
        return videos[0];
    }catch(err: any | unknown){
        // maybe quota exceeded
        console.log(`Error while searching live video from ${channel}: ${err?.message ?? 'no error message'}`)
        console.warn(err)
        return undefined;
    }
}

const channelNameCache = new Map<string, string>()

export async function getChannelName(channel: string): Promise<string> {
    if (channelNameCache.has(channel)) return channelNameCache.get(channel)!!
    const youtubeChannel =  await youtubeApi.getChannel(channel)
    channelNameCache.set(channel, youtubeChannel.name)
    return youtubeChannel.name
}

export async function isLive(channel: String): Promise<Boolean> {
    const res = await axios.get(`https://www.youtube.com/channel/${channel}/live`)
    const str = res.data as String
    return str.indexOf(NOT_LIVING_KEYWORD) == -1
}
