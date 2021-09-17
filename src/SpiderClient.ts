import { setIntervalAsync, SetIntervalAsyncTimer } from 'set-interval-async/dynamic'
import { clearIntervalAsync } from 'set-interval-async'
import { checker } from '../config/config.json'
import { getLiveStreamVideo, isLive } from './YoutubeApi'
import { BraodCastInfo, LiveBroadcast, LiveRoomStatus, LIVE_ROOM_STATUS_CHANNEL, StandAloneRedisClient } from './types'

const INTERVAL = checker.interval // seconds

export class SpiderClient {

    private readonly _channel: string
    private readonly _client: StandAloneRedisClient

    private _timer: SetIntervalAsyncTimer | null = null


    private broadcasted: boolean = false

    constructor(channel: string, client: StandAloneRedisClient) {
        this._channel = channel
        this._client = client
    }

    public async run(): Promise<void> {
        console.debug(`Checking channel ${this.channel} is live streaming...`)
        if (await isLive(this._channel)) {
            console.log(`Channel ${this.channel} is live streaming`)
            if (this.broadcasted) return // already broadcasted
            console.log(`no broadcast found, pushing notifications...`)
            const video = await getLiveStreamVideo(this._channel)
            let info: BraodCastInfo | undefined = undefined
            if (video !== undefined){
                info =  {
                    title: video.title,
                    description: video.description,
                    publishTime: video.datePublished,
                    url: video.url,
                    channelName: video.channel.name,
                    cover: video.thumbnails.high?.url ?? video.thumbnails.medium?.url ?? video.thumbnails.default?.url
                }
            }
            await this.publish({channelId: this.channel, info: info})
            this.broadcasted = true
        } else {
            console.debug(`Channel ${this.channel} is not live streaming.`)
            if (this.broadcasted) {
                this.broadcasted = false
            }
        }
    }


    public async start() {
        this._timer = setIntervalAsync(async () => {
            try {
                await this.run()
            } catch (err: any | unknown) {
                console.warn(`Error while running spider client from channel ${this.channel}: ${err?.message}`)
                console.warn(err)
            }
        }, INTERVAL * 1000)
        const status: LiveRoomStatus = {
            channelId: this.channel,
            status: 'started'
        }
        await this._client.publish(LIVE_ROOM_STATUS_CHANNEL, JSON.stringify(status))
    }

    public async stop(): Promise<boolean> {
        if (this._timer == null) {
            console.warn(`live checker for ${this._channel} already stopped.`)
            return false
        }
        await clearIntervalAsync(this._timer)
        const status: LiveRoomStatus = {
            channelId: this.channel,
            status: 'stopped'
        }
        await this._client.publish(LIVE_ROOM_STATUS_CHANNEL, JSON.stringify(status))
        return true
    }


    get channel(): string {
        return this._channel
    }


    private async publish(value: LiveBroadcast) {
        await this._client.publish(`ylive:${this.channel}`, JSON.stringify(value))
    }

}