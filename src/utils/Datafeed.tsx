// @ts-nocheck
import { useMemo } from 'react';
import { USE_MARKETS } from './markets';
import { sleep } from './utils';

const BASEURL = 'https://dry-ravine-67635.herokuapp.com'
// const BASEURL = 'http://127.0.0.1:5000'
const configurationData = {
  supported_resolutions: ['5', '15', '60', '120', '240', '1D'],
}
export const useTvDataFeed = () => {
  return useMemo(() => makeDataFeed(), []);
};

const makeDataFeed = () => {
  let subscriptions = {};
  const overTime = {};
  const lastReqTime = {};

  const getApi = async (url: string) => {
    try {
      const response = await fetch(url)
      if (response.ok) {
        const responseJson = await response.json()
        return responseJson.success
          ? responseJson.data
          : responseJson
            ? responseJson
            : null
      }
    } catch (err) {
      console.log(`Error fetching from Chart API ${url}: ${err}`)
    }
    return null
  }

  return {
    onReady(callback) {
      setTimeout(() => callback({
        supported_resolutions: ['5', '15', '60', '120', '240', '1D',
          //  '2D', '3D', '5D', '1W', '1M', '2M', '3M', '6M', '12M'
        ],
        supports_group_request: false,
        supports_marks: false,
        supports_search: false,
        supports_timescale_marks: false,
      }), 0)
    },
    async searchSymbol(userInput, exchange, symbolType, onResult) {
      // const result = await apiGet(`${URL_SERVER}search?query=${userInput}&type=${symbolType}&exchange=${exchange}&limit=${1}`);
      // onResult(result);
    },
    async resolveSymbol(
      symbolName,
      onSymboleResolvedCallback,
      onResolveErrorCallback,
      extension?,
    ) {
      let customMarket = []
      try {
        const customMarketStr = localStorage.getItem('customMarkets')
        customMarket = customMarketStr !== null ? JSON.parse(customMarketStr) : []
      } catch (e) {
        console.log('error', e)
      }
      let marketInfo = USE_MARKETS.find(item => item.name === symbolName && !item.deprecated)

      if (!marketInfo) {
        marketInfo = customMarket.find(item => item.name === symbolName || item.userName === symbolName)
        fromCustomMarket = true
      }

      if (!marketInfo) {
        return
      }

      const symbol = {
        ticker: "",
        name: symbolName,
        session: '24x7',
        timezone: 'Etc/UTC',
        minmov: 1,
        pricescale: 10000000,
        has_intraday: true,
        // intraday_multipliers: ['1', '5', '15', '30', '60'],
        has_empty_bars: true,
        has_weekly_and_monthly: false,
        supported_resolutions: configurationData.supported_resolutions,
        volume_precision: 1,
        data_status: 'streaming',
      }
      onSymboleResolvedCallback(symbol);
    },
    async getBars(
      symbolInfo,
      resolution,
      from,
      to,
      onHistoryCallback,
      onErrorCallback,
      firstDataRequest,
    ) {
      from = Math.floor(from);
      to = Math.ceil(to);

      if (from < 1609459200) from = 1609459200

      const key = `${symbolInfo.market}--${resolution}`
      console.log("symbole---name", symbolInfo.name);
      let symbolName = symbolInfo.name.replaceAll("/", "%2F");

      if (overTime[key] && overTime[key] > from) {
        onHistoryCallback([], { nodeData: false })
        return
      }

      try {
        const result = await getApi(
          `${BASEURL}/tv/history?symbol=${symbolName}&resolution=${resolution}&from=${from}&to=${to}`
        )
        if (result.c.length === 0) {
          overTime[key] = to
        } else {
          let price: number = result.c[result.c.length - 1];
          let valume: number = result.v[result.c.length - 1];
          let symbol = symbolName;
          localStorage.setItem('LastValue', JSON.stringify({ Price: price, Symbol: symbol, Valume: valume }));
        }



        onHistoryCallback(parseCandles(result), {
          nodeData: result.length === 0,
        });
      } catch (err) {
        onErrorCallback(err);
      }
    },
    async subscribeBars(
      symbolInfo,
      resolution,
      onRealtimeCallback,
      subscriberUID,
      onResetCacheNeededCallback,
    ) {
      if (subscriptions[subscriberUID]) {
        subscriptions[subscriberUID].stop();
        delete subscriptions[subscriberUID];
      }

      let stopped = false;
      subscriptions[subscriberUID] = { stop: () => (stopped = true) };

      while (!stopped) {
        await sleep(2000);
        for (let i = 0; i < 10; ++i) {
          if (document.visibilityState !== 'visible') {
            await sleep(2000);
          }
        }
        if (stopped) {
          return;
        }

        try {
          const to = Math.ceil(new Date().getTime() / 1000);
          const from = reduceTs(to, resolution * 10);

          if (lastReqTime[subscriberUID] && lastReqTime[subscriberUID] + 1000 * 60 > new Date().getTime()) {
            continue
          }
          lastReqTime[subscriberUID] = new Date().getTime()

          const candle = await getApi(
            `${BASEURL}/tv/history?symbol=SOL%2FUSDC&resolution=${resolution}&from=${from}&to=${to}`
          )

          for (const item of parseCandles(candle)) {
            onRealtimeCallback(item);
          }
          continue;
        } catch (e) {
          console.warn(e);
          await sleep(10000);
          continue;
        }
      }
    },
    unsubscribeBars(subscriberUID) {
      subscriptions[subscriberUID].stop();
      delete subscriptions[subscriberUID];
    },
    async searchSymbols(userInput: string, exchange: string, symbolType: string, onResult: SearchSymbolsCallback) {
      const marketList: any[] = USE_MARKETS.filter(item => item.name.includes(userInput) && !item.deprecated)
      const reList = []
      marketList.forEach(item => {
        reList.push({
          symbol: item.name,
          full_name: item.name,
          description: item.name,
          exchange: 'NFB',
          params: [],
          type: 'spot',
          ticker: item.name
        })
      })
      if (onResult) {
        onResult(reList)
      }
    }
  };
};


const reduceTs = (ts: number, resolutionTv: string) => {
  switch (resolutionTv) {
    case '1':
      return ts - 60 * 1;
    case '3':
      return ts - 60 * 3;
    case '5':
      return ts - 60 * 5;
    case '15':
      return ts - 60 * 15;
    case '30':
      return ts - 60 * 30;
    case '45':
      return ts - 60 * 45;
    case '60':
      return ts - 60 * 60;
    case '120':
      return ts - 60 * 120;
    case '240':
      return ts - 60 * 240;
    case '600':
      return ts - 60 * 600;
    case '720':
      return ts - 60 * 720;
    case '1D':
      return ts - 3600 * 24;
    case '2D':
      return ts - 3600 * 24 * 2;
    case '3D':
      return ts - 3600 * 24 * 3;
    case '5D':
      return ts - 3600 * 24 * 5;
    case '7D':
      return ts - 3600 * 24 * 7;
    case '1M':
      return ts - 3600 * 24 * 31 * 1;
    case '2M':
      return ts - 3600 * 24 * 31 * 2;
    case '3M':
      return ts - 3600 * 24 * 31 * 3;
    case '6M':
      return ts - 3600 * 24 * 31 * 6;
    case '1Y':
      return ts - 3600 * 24 * 31 * 12;
    default:
      throw Error(`reduceTs resolution error: ${resolutionTv}`)
  }
};

interface rawCandles {
  s: string;
  c: Array<number>;
  o: Array<number>;
  l: Array<number>;
  h: Array<number>;
  t: Array<number>;
  v: Array<number>;
}

interface bar {
  time: number;
  close: number;
  open: number;
  low: number;
  high: number;
  volume: number;
}

const parseCandles = (candles: rawCandles) => {
  const result: Array<bar> = [];
  for (let i = 0; i < candles.t.length; i++) {
    result.push({
      time: candles.t[i] * 1000,
      close: candles.c[i],
      open: candles.o[i],
      high: candles.h[i],
      low: candles.l[i],
      volume: candles.v[i],
    });
  }
  return result;
};
