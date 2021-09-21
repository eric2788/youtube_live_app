
import { exit } from 'process'
import { SpiderClient } from './SpiderClient'
import { redis as RedisConfig } from '../config/config.json'
import { createClient } from 'redis'
import { LiveRoomStatus, LIVE_ROOM_STATUS_CHANNEL, StandAloneRedisClient } from './types'


const VERSION = "0.7"

const spiderMap = new Map<string, SpiderClient>()

const exceptions = new Set<string>()
const started = new Set<string>()

async function main() {

    console.log(`正在啟動 Youtube Live Redis Server 版本 ${VERSION}`)

    const client = await initRedis()

    const status: LiveRoomStatus = {
        platform: 'youtube',
        id: 'server',
        status: 'started'
    } 
    await client.publish(LIVE_ROOM_STATUS_CHANNEL, JSON.stringify(status))

    console.log(`Youtube Live Redis Server v${VERSION} 已成功啟動。`)

    while (true) {

        try {

            await sleep(1000) // sleep per one second

            const channels = await client.pubSubChannels("ylive:*")

            const subscribing = new Set<string>()
            for (const channel of channels) {
                const channelId = channel.replace("ylive:", "")
                if (exceptions.has(channelId)) continue
                if (!channelId.startsWith("UC")) {
                    console.warn(`Unknown channel id: ${channelId}, skipped`)
                    exceptions.add(channelId)
                    continue
                }
                subscribing.add(channelId)
            }

            const listening = new Set([...spiderMap.keys()])

            for (const toListen of minus(subscribing, listening)) {
                if (started.has(toListen)) continue
                started.add(toListen)
                await startSpider(toListen, client)
                console.log(`已成功啟動監聽頻道 ${toListen} 。`)
            }

            for (const toStop of minus(listening, subscribing)) {
                removeSpider(toStop)
                    .then(() => {
                        console.log(`已中止 ${toStop} 頻道的監聽。`)
                        started.delete(toStop)
                    })
                    .catch(err => console.error(`Error while stopping spider from channel ${toStop}`, err))
            }

        } catch (err: any) {
            console.warn(`Pubsub 監聽時出現錯誤: ${err?.message}`)
        }

    }
}



async function startSpider(channel: string, client: StandAloneRedisClient) {
    try {
        const spider = new SpiderClient(channel, client)
        spiderMap.set(channel, spider)
        await spider.start()
    } catch (err: any) {
        console.error(`初始化頻道 ${channel} 時 出現錯誤, 已停止監聽此頻道。 `, err)
        started.delete(channel)
        exceptions.add(channel)
        const status: LiveRoomStatus = {
            platform: 'youtube',
            id: channel,
            status: 'error'
        }
        await client.publish(LIVE_ROOM_STATUS_CHANNEL, JSON.stringify(status))
    }
}


const sleep = (ms: number) => new Promise((res,) => setTimeout(res, ms))

async function removeSpider(channel: string) {
    const spider = spiderMap.get(channel)
    if (spider == undefined) {
        console.warn(`The spider of ${channel} is not exist.`)
        return
    }
    await spider.stop()
    spiderMap.delete(channel)
}

async function initRedis(): Promise<StandAloneRedisClient> {
    try {
        console.log(`正在連接到 Redis Server...`)
        const client = createClient({ socket: RedisConfig })
        client.on("error", err => console.warn(`連接失敗: ${err?.message}`))
        await client.connect()
        await client.select(RedisConfig.db)
        console.log(`Redis server 已成功連接。`)
        return client;
    } catch (err: any | unknown) {
        console.warn(`連接到 Redis 伺服器時出現錯誤: ${err?.message}, 五秒後重連...`)
        await sleep(5000)
        return await initRedis()
    }
}

function* minus(from: Set<string>, to: Set<string>): Generator<string> {
    const fromSet = new Set(from);
    const toSet = new Set(to);

    for (const v of fromSet.values()) {
        if (!toSet.delete(v)) {
            yield v;
        }
    }

}


main()
    .then(() => console.log('run completed.'))
    .catch(console.error)
    .finally(() => exit())

