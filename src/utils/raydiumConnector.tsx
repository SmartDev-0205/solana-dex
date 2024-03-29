import { TradeLayout } from './types';

export default class RaydiumApi {
  static URL: string = 'https://dry-ravine-67635.herokuapp.com/';

  static async get(path: string) {
    try {
      const response = await fetch(this.URL + path);
      if (response.ok) {
        const responseJson = await response.json();
        return responseJson.success ? responseJson.data.reverse() : null;
      }
    } catch (err) {
      console.log(`Error fetching from Raydium API ${path}: ${err}`);
    }
    return null;
  }

  static async getRecentTrades(
    marketAddress: string,
  ): Promise<TradeLayout[] | null> {
    return RaydiumApi.get(`trades/address/${marketAddress}`);
  }
}
