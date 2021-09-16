import { setIntervalAsync, SetIntervalAsyncTimer } from 'set-interval-async/dynamic'
import { clearIntervalAsync } from 'set-interval-async'
import { checker } from '../config/config.json'
import { getLiveStreamVideo, isLive } from './YoutubeApi'
import { publish } from './redis_publisher'

const INTERVAL = checker.interval

export class SpiderClient {

    private readonly _channel: string

    private _timer: SetIntervalAsyncTimer | null = null

    constructor(channel: string){
        this._channel = channel
    }

    public async run(): Promise<void> {
        console.debug(`Checking channel ${this.channel} is live streaming...`)
        if (await isLive(this._channel)){
            console.log(`Channel ${this.channel} is live streaming, pushing notifications...`)
            const video = await getLiveStreamVideo(this._channel)
            // do something
            const toSend = {
                title: video?.title
            }
            await publish(`ylive:${this.channel}`, JSON.stringify(toSend))
        }else{
            console.debug(`Channel ${this.channel} is not live streaming.`)
        }
    }


    public start() {
        this._timer = setIntervalAsync(async () => {
            try {
                await this.run()
            }catch(err: any | unknown) {
                console.warn(`Error while running spider client from channel ${this.channel}: ${err?.message}`)
                console.warn(err)
            }
        }, INTERVAL)
    }

    public async stop(): Promise<boolean> {
        if (this._timer == null){
            console.warn(`live checker for ${this._channel} already stopped.`)
            return false
        }
        await clearIntervalAsync(this._timer)
        return true
    }


    get channel(): string {
        return this._channel
    }

}