import express from 'express'
import axios from 'axios'
import cors from 'cors'
import cheerio from 'cheerio'

const app = express()
app.use(cors())
app.disable('x-powered-by')
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
const port = 4000

const extractRawList = str => {
  const begin = str.indexOf('<ul class="resultList">')
  const end = str.indexOf('</ul>') + 5
  const list = str.slice(begin, end)
  return list
}

const parseRow = item => {
  const number = item.find('.colNumber').text()
  const best = item.find('.colBstLap').text()
  const position = item.find('.colPos').text()

  return { position, number, best }
}

const listToJson = list => {
  const json = []
  for (let i = 1; i < list.length; i++) {
    const row = parseRow(list.eq(i))
    json.push(row)
  }
  return json
}

const findRacerRow = (list, number) => {
  for (let i = 1; i < list.length; i++) {
    const row = parseRow(list.eq(i))
    if (row.number === number) {
      return row
    }
  }
  return undefined
}

app.post('/list', async (req, res) => {
  const url = 'http://navaktiming.com/live/LIVE.HTM'
  const number = req.body.number
  const relation = req.body.relation
  try {
    const rawhtml = await axios.get(url)
    const rawlist = extractRawList(rawhtml.data)

    const $ = cheerio.load(rawlist, null, false)
    const listElements = $('.resultList').find('li')
    // const list = listToJson(listElements)
    const racer = findRacerRow(listElements, number)
    racer.relation = relation

    return res.status(200).send(racer)
  } catch (error) {
    console.error(error)
    return res.status(400).end()
  }
})

const server = app.listen(port, () => {
  console.log(`Server live @port ${port}`)
})
