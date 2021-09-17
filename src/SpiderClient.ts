import { setIntervalAsync, SetIntervalAsyncTimer } from 'set-interval-async/dynamic'
import { clearIntervalAsync } from 'set-interval-async'
import { checker } from '../config/config.json'
import { getChannelName, getLiveStreamVideo, isLive } from './YoutubeApi'
import { BraodCastInfo, LiveBroadcast, LiveRoomStatus, LIVE_ROOM_STATUS_CHANNEL, StandAloneRedisClient } from './types'

const INTERVAL = checker.interval // seconds

export class SpiderClient {

    private readonly _channel: string
    private readonly _client: StandAloneRedisClient

    private _timer: SetIntervalAsyncTimer | null = null

    private _broadcasted: boolean = false

    constructor(channel: string, client: StandAloneRedisClient) {
        this._channel = channel
        this._client = client
    }

    public async run(): Promise<void> {
        console.debug(`正在檢查頻道 ${this.channel}...`)
        if (await isLive(this._channel)) {
            console.log(`頻道 ${this.channel} 正在直播`)
            if (this._broadcasted) return // save quota
            const video = await getLiveStreamVideo(this._channel)
            let info: BraodCastInfo | undefined = undefined
            let name: string
            if (video !== undefined){
                info =  {
                    title: video.title,
                    description: video.description,
                    publishTime: video.datePublished,
                    url: video.shortUrl ?? video.url,
                    cover: video.thumbnails.high?.url ?? video.thumbnails.medium?.url ?? video.thumbnails.default?.url
                }
                
                name = video.channel.name
            }else{
                name = await getChannelName(this.channel)
            }

            await this.publish({
                channelId: this.channel, 
                channelName: name,
                status: 'live',
                info: info
            })
            this._broadcasted = true
        } else {
            console.debug(`頻道 ${this.channel} 並沒有在直播`)
            await this.publish({
                channelId: this.channel,
                channelName: await getChannelName(this.channel),
                status: 'idle'
            })
            if (this._broadcasted){
                this._broadcasted = false
            }
        }
    }


    public async start() {
        this._timer = setIntervalAsync(async () => {
            try {
                await this.run()
            } catch (err: any | unknown) {
                console.warn(`檢查頻道 ${this.channel} 時出現錯誤: ${err?.message}`)
                console.warn(err)
            }
        }, INTERVAL * 1000)
        const status: LiveRoomStatus = {
            platform: 'youtube',
            id: this.channel,
            status: 'started'
        }
        await this._client.publish(LIVE_ROOM_STATUS_CHANNEL, JSON.stringify(status))
    }

    public async stop(): Promise<boolean> {
        if (this._timer == null) {
            console.warn(`頻道 ${this._channel} 的監聽已經關閉`)
            return false
        }
        await clearIntervalAsync(this._timer)
        const status: LiveRoomStatus = {
            platform: 'youtube',
            id: this.channel,
            status: 'stopped'
        }
        await this._client.publish(LIVE_ROOM_STATUS_CHANNEL, JSON.stringify(status))
        return true
    }

    get channel(): string {
        return this._channel
    }

    private async publish(value: LiveBroadcast) {
        console.log(`正在發送廣播通知: ${JSON.stringify(value, undefined, 4)}`)
        await this._client.publish(`ylive:${this.channel}`, JSON.stringify(value))
    }

}