import ytdl from 'ytdl-core'
import ytsr from 'ytsr'
import { embed, player } from '../utils'
const searchData = {}

const search = (msg, Embed, data) => {
  if (!msg.content.replace(/kaori|search| /gi, '')) {
    Embed.setDescription('검색 키워드를 입력해줘!')
    msg.channel.send(Embed)
    return
  }

  if (!msg.member.voice.channel) {
    Embed.setDescription('음악을 재생하려면 음성 채널에 있어야 해!')
    msg.channel.send(Embed)
    return
  }

  if (data[msg.guild.id] && msg.member.voice.channel != data[msg.guild.id].voiceChannel) {
    Embed.setDescription('음악을 추가하려면 동일한 음성 채널에 있어야 해!')
    msg.channel.send(Embed)
    return
  }

  ytsr.getFilters(msg.content.replace(/kaori|search/gi, ''))
    .then(async filters => {
      const res = await ytsr(null, {
        limit: 5,
        nextpageRef: filters.get('Type').find(o => o.name === 'Video').ref
      })

      Embed.setTitle('Search!')
        .setDescription(res.query + '에 대한 검색 결과')

      for (const key in res.items) {
        const item: any = res.items[key]
        Embed.addField(`${Number(key) + 1}. ${item.title}`, item.live ? 'Live' : item.duration)
      }

      searchData[msg.channel.id] = res.items
      const iconList = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣']

      const filter = (reaction, user) => {
        return iconList.includes(reaction.emoji.name) && user.id === msg.author.id
      }

      msg.channel.send(Embed).then(reply => {
        for (const key in res.items) {
          reply.react(iconList[key])
        }
        reply.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
          .then(async collected => {
            const reaction = collected.first()

            for (const key in res.items) {
              const icon = iconList[key]
              if (reaction.emoji.name === icon) {
                const initEmbed = embed(msg)
                const selected = searchData[msg.channel.id][key]

                if (!data[msg.guild.id]) {
                  data[msg.guild.id] = {
                    voiceChannel: msg.member.voice.channel,
                    conn: null,
                    queue: []
                  }
                }

                const info = await ytdl.getInfo(ytdl.getVideoID(selected.link))
                data[msg.guild.id].queue.push({
                  id: info.videoDetails.videoId,
                  title: info.videoDetails.title,
                  url: info.videoDetails.video_url,
                  duration: info.videoDetails.lengthSeconds,
                  msg
                })
                if (!data[msg.guild.id].conn) player(msg, data)
                else {
                  const lengthSeconds = Number(info.videoDetails.lengthSeconds)
                  const sec = lengthSeconds % 60
                  const min = Math.floor(lengthSeconds / 60 % 60)
                  const hour = Math.floor(lengthSeconds / 60 / 60)

                  initEmbed.setTitle('Add')
                    .setDescription('선택한 음악을 대기열에 추가했어!')
                    .addField(info.videoDetails.title, `${hour ? hour + '시간' : ''} ${min ? min + '분' : ''} ${sec ? sec + '초' : ''}`)
                  msg.channel.send(initEmbed)
                }
              }
            }
          })
          .catch(collected => {
            msg.reply('검색 결과를 선택하지 않아 취소했어!')
          })
      })
    })
}

export default search
