import { setIntervalAsync, SetIntervalAsyncTimer } from 'set-interval-async/dynamic'
import { clearIntervalAsync } from 'set-interval-async'
import { checker } from '../config/config.json'
import { getChannelName, getLiveStreamDetails, getLiveStatus } from './yt_utils'
import { BraodCastInfo, LiveBroadcast, LiveRoomStatus, LiveStatus, LIVE_ROOM_STATUS_CHANNEL, StandAloneRedisClient } from './types'

const INTERVAL = checker.interval // seconds

export class SpiderClient {

    private readonly _channel: string
    private readonly _client: StandAloneRedisClient

    private _timer: SetIntervalAsyncTimer | null = null

    private _lastStatus: LiveStatus = 'idle'

    constructor(channel: string, client: StandAloneRedisClient) {
        this._channel = channel
        this._client = client
    }

    public async run(): Promise<void> {
        console.debug(`正在檢查頻道 ${this.channel}...`)
        const status = await getLiveStatus(this._channel)
         if (status != 'idle') {
            console.log(`頻道 ${this.channel} ${status == 'live' ? '正在直播' : '有預定直播'}`)
            if (this._lastStatus == status) return // save quota
            const info = await getLiveStreamDetails(this._channel, status == 'upcoming') // 放在 getChannelName 之前以讀取之前的 cache
            await this.publish({
                channelId: this.channel, 
                channelName: await getChannelName(this.channel),
                status: status,
                info
            })
            this._lastStatus = status
        } else {
            console.debug(`頻道 ${this.channel} 並沒有在直播`)
            await this.publish({
                channelId: this.channel,
                channelName: await getChannelName(this.channel),
                status: status
            })
            if (this._lastStatus != 'idle'){
                this._lastStatus = 'idle'
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
        if (value.status != 'idle'){
            console.log(`正在發送廣播通知: ${JSON.stringify(value, undefined, 4)}`)
        }
        await this._client.publish(`ylive:${this.channel}`, JSON.stringify(value))
    }

}