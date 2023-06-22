import fetch from 'node-fetch';

const site = process.env.SITE;
const API_ENDPOINT = `https://my.autarco.com/api/m1/site/${site}/power`;
const basic = Buffer.from(process.env.USERNAME + ":" + process.env.PASSWORD)
                    .toString('base64');
const headers = {
  'Authorization': `Basic ${basic}`
};

exports.handler = async (event, context) => {
  try {
    const response = await fetch(API_ENDPOINT, { headers: headers });
    const data = await response.json();
    const graphs = Object.values(data.stats.graphs.pv_power);

    // a LaMetric frame for each inverter, showing a graph of values.
    let frames = graphs.map(function (graph, index) {
      return ({
        "index": index + 1,
        "chartData": Object.values(graph).slice(-37)
      })
    });

    // add current overall power as the first display frame.
    frames.unshift({
      "text": `${data.stats.kpis.pv_now} W`,
      "icon": 33038,
      "index": 0
    });

    return {
      statusCode: 200,
      headers: {
        "Cache-Control": `private, max-age=60, must-revalidate`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "frames": frames
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(error)
    };
  }
};

