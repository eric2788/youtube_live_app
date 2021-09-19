import axios from 'axios'
import data from '../config/config.json'
import fs from 'fs/promises'

const NOT_LIVING_KEYWORD = data.checker.not_live_keyword

const UPCOMING_KEYWORD = data.checker.upcoming_keyword

export async function getLiveStatus(channel: String): Promise<'live' | 'upcoming' | 'idle'> {
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



getLiveStatus('UCA1d3HFGFUmkKr2JIUA5Vlw')
.then(console.log)
.catch(console.error)
