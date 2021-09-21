import axios from 'axios'
import data from '../config/config.json'
import * as utils from '../src/yt_utils'
import fs from 'fs/promises'
import { exit } from 'process'

const { 
    not_live_keyword: NOT_LIVING_KEYWORD, 
    upcoming_keyword: UPCOMING_KEYWORD, 
    live_keyword: LIVE_KEYWORD
} = data.checker

async function getLiveStatus(channel: String): Promise<'live' | 'upcoming' | 'idle'> {
    const res = await axios.get(`https://www.youtube.com/channel/${channel}/live`, {
        
    })
    const str = res.data as String
    await fs.writeFile('response.txt', str)
    console.debug(`NOT_LIVING: ${str.indexOf(NOT_LIVING_KEYWORD)} || UPCOMING: ${str.indexOf(UPCOMING_KEYWORD)} || LIVING: ${str.indexOf(LIVE_KEYWORD)}`)
    console.debug(`設定提醒: ${str.indexOf('設定提醒')}`)
    if (str.indexOf(NOT_LIVING_KEYWORD) == -1){
        return str.indexOf(UPCOMING_KEYWORD) == -1 ? 'live' : 'upcoming'
    }else{
        return 'idle'
    }
}

const channel: {[k: string]: string} = {
    oto: 'UCvEX2UICvFAa_T6pqizC20g',
    nano: 'UC0lIq8G4LgDPlXsDmYSUExw',
    mana: 'UCIaC5td9nGG6JeKllWLwFLA',
    anon: 'UCUKngXhjnKJ6KCyuC7ejI_w'
}


async function test() {  
    const selected = channel.mana
    const status = await utils.getLiveStatus(selected)
    console.log(`狀態: ${status}`)
    if (status == 'idle') return
    const details = await utils.getLiveStreamDetails(selected, status == 'upcoming')
    const channelName = await utils.getChannelName(selected)
    console.log(`頻道名稱: ${channelName}`)
    console.log(`詳細: ${details == undefined ? "無": JSON.stringify(details, undefined, 4)}`)
}

async function testLiveStatus(){
    for (const name in channel){
        const ch = channel[name]
        const status = await utils.getLiveStatus(ch)
        console.log(`${name} 的狀態是 ${status}`)
    }
}

async function testChannelName(){
    const name = await utils.getChannelName(channel.oto)
    console.log(name)
}



testLiveStatus().catch(console.error).finally(() => exit())