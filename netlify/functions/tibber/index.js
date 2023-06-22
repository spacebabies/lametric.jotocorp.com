import fetch from 'node-fetch';

const token = process.env.TIBBER_ACCESS_TOKEN;
const API_ENDPOINT = `https://api.tibber.com/v1-beta/gql`;
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': "application/json"
};
const query = `{
  viewer {
    homes {
      currentSubscription{
        priceInfo{
          current{
            total
            level
          }
          today{
            total
            startsAt
          }
          tomorrow{
            total
            startsAt
          }
        }
      }
    }
  }
}`;

exports.handler = async (event, context) => {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'post',
      headers: headers,
      body: JSON.stringify({ query: query })
    });
    const data = await response.json();

    // Present a given number as nicely formatted monetary amount.
    const moneyFmt = function (amount) {
      return `€ ${amount.toLocaleString("nl-NL", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
    };

    // Rounds a number to two decimal places and returns it as an integer.
    const roundToTwoDecimalPlaces = function (number) {
      return Math.round(number * 100);
    };

    // a frame for each home
    let frames = data.data.viewer.homes.map(function (home) {
      const priceInfo = home.currentSubscription.priceInfo;

      /**
       * 53297 dark red
       * 53296 light red
       * 53229 cyan
       * 53294 light green
       * 53295 dark green
       */
      let icon = 53229;
      switch (priceInfo.current.level) {
        case 'VERY_CHEAP':
          icon = 53297;
          break;
        case 'CHEAP':
          icon = 53296;
          break;
        case 'EXPENSIVE':
          icon = 53295;
          break;
        case 'VERY_EXPENSIVE':
          icon = 53294;
          break;
      }

      const currentHour = new Date();
      currentHour.setMinutes(0, 0, 0); // Set minutes, seconds, and milliseconds to zero

      // Merge all hours
      const futureHours = priceInfo.today.concat(
        priceInfo.tomorrow
      // Remove empty elements
      ).filter(
        day => day !== undefined
      // Keep objects where the start time is greater than or equal to the beginning of the current hour.
      ).filter(
        day => {
          const startTime = new Date(day.startsAt);
          return startTime >= currentHour;
        }
      // Return an array with only the rounded values
      ).map(
        day => roundToTwoDecimalPlaces(day.total)
      );

      // Find the absolute minimum value in the array
      const min = Math.min(...futureHours);

      // Transpose the array so the lowest value is zero
      for (let i = 0; i < futureHours.length; i++) {
        futureHours[i] -= min;
      }

      return [
        {
          "text": moneyFmt(priceInfo.current.total),
          "icon": icon
        },
        {
          "chartData": futureHours
        }
      ]
    });

    // Cache the result until the next hour begins.
    const currentDate = new Date();
    const currentMinutes = currentDate.getMinutes();
    const secondsUntilNextHour = (60 - currentMinutes) * 60;

    return {
      statusCode: 200,
      headers: {
        "Cache-Control": `private, max-age=${secondsUntilNextHour}, must-revalidate`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "frames": frames.flat(1)
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "error": error
      })
    };
  }
};

/**
 * example API response:
 * 
 * {
  "data": {
    "viewer": {
      "homes": [
        {
          "currentSubscription": {
            "priceInfo": {
              "current": {
                "total": 0.1016,
                "energy": 0.0018,
                "tax": 0.0998,
                "startsAt": "2023-05-15T14:00:00.000+02:00"
              },
              "today": [
                {
                  "total": 0.2411,
                  "energy": 0.1134,
                  "tax": 0.1277,
                  "startsAt": "2023-05-15T00:00:00.000+02:00"
                },
                {
                  "total": 0.2256,
                  "energy": 0.101,
                  "tax": 0.1246,
                  "startsAt": "2023-05-15T01:00:00.000+02:00"
                },
                {
                  "total": 0.2195,
                  "energy": 0.0961,
                  "tax": 0.1234,
                  "startsAt": "2023-05-15T02:00:00.000+02:00"
                },
                {
                  "total": 0.2165,
                  "energy": 0.0937,
                  "tax": 0.1228,
                  "startsAt": "2023-05-15T03:00:00.000+02:00"
                },
                {
                  "total": 0.2116,
                  "energy": 0.0898,
                  "tax": 0.1218,
                  "startsAt": "2023-05-15T04:00:00.000+02:00"
                },
                {
                  "total": 0.2148,
                  "energy": 0.0924,
                  "tax": 0.1224,
                  "startsAt": "2023-05-15T05:00:00.000+02:00"
                },
                {
                  "total": 0.205,
                  "energy": 0.0845,
                  "tax": 0.1205,
                  "startsAt": "2023-05-15T06:00:00.000+02:00"
                },
                {
                  "total": 0.2212,
                  "energy": 0.0974,
                  "tax": 0.1238,
                  "startsAt": "2023-05-15T07:00:00.000+02:00"
                },
                {
                  "total": 0.2926,
                  "energy": 0.1546,
                  "tax": 0.138,
                  "startsAt": "2023-05-15T08:00:00.000+02:00"
                },
                {
                  "total": 0.3185,
                  "energy": 0.1753,
                  "tax": 0.1432,
                  "startsAt": "2023-05-15T09:00:00.000+02:00"
                },
                {
                  "total": 0.2694,
                  "energy": 0.136,
                  "tax": 0.1334,
                  "startsAt": "2023-05-15T10:00:00.000+02:00"
                },
                {
                  "total": 0.2297,
                  "energy": 0.1043,
                  "tax": 0.1254,
                  "startsAt": "2023-05-15T11:00:00.000+02:00"
                },
                {
                  "total": 0.1803,
                  "energy": 0.0648,
                  "tax": 0.1155,
                  "startsAt": "2023-05-15T12:00:00.000+02:00"
                },
                {
                  "total": 0.1253,
                  "energy": 0.0208,
                  "tax": 0.1045,
                  "startsAt": "2023-05-15T13:00:00.000+02:00"
                },
                {
                  "total": 0.1016,
                  "energy": 0.0018,
                  "tax": 0.0998,
                  "startsAt": "2023-05-15T14:00:00.000+02:00"
                },
                {
                  "total": 0.1244,
                  "energy": 0.02,
                  "tax": 0.1044,
                  "startsAt": "2023-05-15T15:00:00.000+02:00"
                },
                {
                  "total": 0.1722,
                  "energy": 0.0582,
                  "tax": 0.114,
                  "startsAt": "2023-05-15T16:00:00.000+02:00"
                },
                {
                  "total": 0.2444,
                  "energy": 0.1161,
                  "tax": 0.1283,
                  "startsAt": "2023-05-15T17:00:00.000+02:00"
                },
                {
                  "total": 0.2945,
                  "energy": 0.1561,
                  "tax": 0.1384,
                  "startsAt": "2023-05-15T18:00:00.000+02:00"
                },
                {
                  "total": 0.3299,
                  "energy": 0.1844,
                  "tax": 0.1455,
                  "startsAt": "2023-05-15T19:00:00.000+02:00"
                },
                {
                  "total": 0.2467,
                  "energy": 0.1178,
                  "tax": 0.1289,
                  "startsAt": "2023-05-15T20:00:00.000+02:00"
                },
                {
                  "total": 0.1823,
                  "energy": 0.0663,
                  "tax": 0.116,
                  "startsAt": "2023-05-15T21:00:00.000+02:00"
                },
                {
                  "total": 0.1694,
                  "energy": 0.056,
                  "tax": 0.1134,
                  "startsAt": "2023-05-15T22:00:00.000+02:00"
                },
                {
                  "total": 0.1583,
                  "energy": 0.0471,
                  "tax": 0.1112,
                  "startsAt": "2023-05-15T23:00:00.000+02:00"
                }
              ],
              "tomorrow": [
                {
                  "total": 0.1646,
                  "energy": 0.0522,
                  "tax": 0.1124,
                  "startsAt": "2023-05-16T00:00:00.000+02:00"
                },
                {
                  "total": 0.1643,
                  "energy": 0.052,
                  "tax": 0.1123,
                  "startsAt": "2023-05-16T01:00:00.000+02:00"
                },
                {
                  "total": 0.1667,
                  "energy": 0.0539,
                  "tax": 0.1128,
                  "startsAt": "2023-05-16T02:00:00.000+02:00"
                },
                {
                  "total": 0.1709,
                  "energy": 0.0572,
                  "tax": 0.1137,
                  "startsAt": "2023-05-16T03:00:00.000+02:00"
                },
                {
                  "total": 0.1734,
                  "energy": 0.0593,
                  "tax": 0.1141,
                  "startsAt": "2023-05-16T04:00:00.000+02:00"
                },
                {
                  "total": 0.1932,
                  "energy": 0.0751,
                  "tax": 0.1181,
                  "startsAt": "2023-05-16T05:00:00.000+02:00"
                },
                {
                  "total": 0.303,
                  "energy": 0.1629,
                  "tax": 0.1401,
                  "startsAt": "2023-05-16T06:00:00.000+02:00"
                },
                {
                  "total": 1.3938,
                  "energy": 1.0355,
                  "tax": 0.3583,
                  "startsAt": "2023-05-16T07:00:00.000+02:00"
                },
                {
                  "total": 1.42,
                  "energy": 1.0565,
                  "tax": 0.3635,
                  "startsAt": "2023-05-16T08:00:00.000+02:00"
                },
                {
                  "total": 1.3246,
                  "energy": 0.9802,
                  "tax": 0.3444,
                  "startsAt": "2023-05-16T09:00:00.000+02:00"
                },
                {
                  "total": 0.8427,
                  "energy": 0.5946,
                  "tax": 0.2481,
                  "startsAt": "2023-05-16T10:00:00.000+02:00"
                },
                {
                  "total": 0.5266,
                  "energy": 0.3418,
                  "tax": 0.1848,
                  "startsAt": "2023-05-16T11:00:00.000+02:00"
                },
                {
                  "total": 0.309,
                  "energy": 0.1677,
                  "tax": 0.1413,
                  "startsAt": "2023-05-16T12:00:00.000+02:00"
                },
                {
                  "total": 0.2624,
                  "energy": 0.1304,
                  "tax": 0.132,
                  "startsAt": "2023-05-16T13:00:00.000+02:00"
                },
                {
                  "total": 0.225,
                  "energy": 0.1005,
                  "tax": 0.1245,
                  "startsAt": "2023-05-16T14:00:00.000+02:00"
                },
                {
                  "total": 0.2666,
                  "energy": 0.1338,
                  "tax": 0.1328,
                  "startsAt": "2023-05-16T15:00:00.000+02:00"
                },
                {
                  "total": 0.6602,
                  "energy": 0.4486,
                  "tax": 0.2116,
                  "startsAt": "2023-05-16T16:00:00.000+02:00"
                },
                {
                  "total": 1.1313,
                  "energy": 0.8255,
                  "tax": 0.3058,
                  "startsAt": "2023-05-16T17:00:00.000+02:00"
                },
                {
                  "total": 1.226,
                  "energy": 0.9013,
                  "tax": 0.3247,
                  "startsAt": "2023-05-16T18:00:00.000+02:00"
                },
                {
                  "total": 1.2611,
                  "energy": 0.9294,
                  "tax": 0.3317,
                  "startsAt": "2023-05-16T19:00:00.000+02:00"
                },
                {
                  "total": 1.2738,
                  "energy": 0.9396,
                  "tax": 0.3342,
                  "startsAt": "2023-05-16T20:00:00.000+02:00"
                },
                {
                  "total": 1.2587,
                  "energy": 0.9274,
                  "tax": 0.3313,
                  "startsAt": "2023-05-16T21:00:00.000+02:00"
                },
                {
                  "total": 0.3501,
                  "energy": 0.2006,
                  "tax": 0.1495,
                  "startsAt": "2023-05-16T22:00:00.000+02:00"
                },
                {
                  "total": 0.201,
                  "energy": 0.0813,
                  "tax": 0.1197,
                  "startsAt": "2023-05-16T23:00:00.000+02:00"
                }
              ]
            }
          }
        }
      ]
    }
  }
}
 */