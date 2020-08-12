const ytsr = require('ytsr')

const search = (msg, embed, data) => {
  ytsr.getFilters(msg.content.replace(/kaori|search/gi, ''), (err, filters) => {
    if (err) throw err
    let filter = filters.get('Type').find(o => o.name === 'Video')
    ytsr(null, {
      limit: 5,
      nextpageRef: filter.ref,
    }, (err, res) => {
      if (err) throw err
      console.log(res)
      embed.setTitle('Search!')
        .setDescription(res.query + '에 대한 검색 결과')
      for (const key in res.items) {
        const element = res.items[key]
        embed.addField(`${Number(key) + 1}. ${element.title}`, element.duration)
      }
      msg.channel.send(embed)
    })
  })
}

export default search
