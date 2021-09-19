import axios from 'axios'
import data from '../config/config.json'
import * as youtube from '../src/youtube_api'
import * as utils from '../src/yt_utils'
import fs from 'fs/promises'
import { exit } from 'process'

const NOT_LIVING_KEYWORD = data.checker.not_live_keyword

const UPCOMING_KEYWORD = data.checker.upcoming_keyword

async function getLiveStatus(channel: String): Promise<'live' | 'upcoming' | 'idle'> {
    const res = await axios.get(`https://www.youtube.com/channel/${channel}/live`, {
        
    })
    const str = res.data as String
    await fs.writeFile('response.txt', str)
    console.debug(`NOT_LIVING: ${str.indexOf(NOT_LIVING_KEYWORD)} || UPCOMING: ${str.indexOf(UPCOMING_KEYWORD)}`)
    console.debug(`設定提醒: ${str.indexOf('設定提醒')}`)
    if (str.indexOf(NOT_LIVING_KEYWORD) == -1){
        return str.indexOf(UPCOMING_KEYWORD) == -1 ? 'live' : 'upcoming'
    }else{
        return 'idle'
    }
}


async function test() {
    const channel = {
        oto: 'UCvEX2UICvFAa_T6pqizC20g',
        nano: 'UC0lIq8G4LgDPlXsDmYSUExw'
    }
    const selected = channel.oto
    const status = await utils.getLiveStatus(selected)
    console.log(`狀態: ${status}`)
    if (status == 'idle') return
    const details = await utils.getLiveStreamDetails(selected, status == 'upcoming')
    const channelName = await utils.getChannelName(selected)
    console.log(`頻道名稱: ${channelName}`)
    console.log(`詳細: ${details == undefined ? "無": JSON.stringify(details, undefined, 4)}`)
}



test().finally(() => exit())