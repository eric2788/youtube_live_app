import redis from 'redis'
import { promisify } from 'util'
import { redis as redisConfig } from '../config/config.json'

const client = redis.createClient(redisConfig)

client.on('error', console.error)
client.on('ready', () => console.log(`Redis server 已準備就緒`))
client.on('connect', () => console.log('Redis server 已成功連接。'))
client.on('reconnecting', ({delay, attempt}) => console.log(`連線失敗。隔 ${delay} 毫秒後嘗試重連... #${attempt}`))
client.on('end', () => console.log('與 Redis server 的連接已關閉。'))


export const publish = promisify(client.publish).bind(client)
export const disconnect = promisify(client.quit).bind(client)

export const pushLiveNotify = async function(channel: string, data: any) {
    return await publish(`ylive:${channel}`, JSON.stringify(data))
}


const pubsub = promisify(client.pubsub).bind(client)


export async function getActiveChannels(): Promise<any> {
    return new Promise((res, rej) => {
        client.pubsub('CHANNELS', `ylive:*`, (err, channels) => {
            if (err){
                rej(err)
            }else{
                res(channels)
            }
        })
    })

}