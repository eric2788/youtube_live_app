
import { exit } from 'process'
import { SpiderClient } from './SpiderClient'
import redis from 'redis'
import { disconnect } from './redis_publisher'

const spiderMap = new Map<string, SpiderClient>()

async function main(){
    const client = redis.createClient()
}



async function initSpider(channel: string){
    const spider = new SpiderClient(channel)
}



main()
.then(() => console.log('run completed.'))
.catch(console.error)
.finally(() => disconnect())
.finally(() => exit())

