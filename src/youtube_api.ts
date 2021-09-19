import axios from 'axios'
import data from '../config/config.json'
import { ChannelResponse, VideoResponse, VideoSearchResponse } from './types'

const API_KEY = data.api.key

const youtubeAPI = axios.create({
    baseURL: 'https://youtube.googleapis.com/youtube/v3/',
    params: {
        key: API_KEY,
        maxResults: 1
    },
    headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'zh-HK',
        'Content-Language': 'zh-HK',
        'X-Timezone-Offset': -480 // utc +8
    },
    withCredentials: false
})


export async function getVideo(id: string): Promise<VideoResponse> {
    const res = await youtubeAPI.get('videos', {
        params: {
           part: 'snippet,liveStreamingDetails',
           id: id
        }
    })
    return res.data as VideoResponse
}


export async function searchVideo(channelId: string, status: 'live' | 'upcoming' | 'none' | 'completed' = 'none'): Promise<VideoSearchResponse>{
    const res = await youtubeAPI.get('search', {
        params: {
            part: 'snippet',
            channelId,
            eventType: status,
            order: 'date',
            type: 'video'
        }
    })
    return res.data as VideoSearchResponse
}

export async function getChannel(channelId: string): Promise<ChannelResponse> {
    const res = await youtubeAPI.get('channels', {
        params: {
            part: 'snippet',
            id: channelId,
        }
    })
    return res.data as ChannelResponse
}