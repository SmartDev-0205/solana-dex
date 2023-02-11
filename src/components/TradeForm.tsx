// eslint-disable-next-line 
import { Button, Col, Input, Row, Select, Slider, Switch } from 'antd';
import React, { useEffect, useState } from 'react';
import {
  useFeeDiscountKeys,
  useLocallyStoredFeeDiscountKey,
  useMarkPrice,
  useMarket,
  useSelectedBaseCurrencyAccount,
  useSelectedBaseCurrencyBalances,
  useSelectedOpenOrdersAccount,
  useSelectedQuoteCurrencyAccount,
  useSelectedQuoteCurrencyBalances,
} from '../utils/markets';

import FloatingElement from './layout/FloatingElement';
import { SwitchChangeEventHandler } from 'antd/es/switch';
import { notify } from '../utils/notifications';
import { refreshCache } from '../utils/fetch-loop';
import styled from 'styled-components';
import tuple from 'immutable-tuple';
import { useSendConnection } from '../utils/connection';
import { useWallet } from '../utils/wallet';
import {floorToDecimal, getDecimalCount, roundToDecimal,} from '../utils/utils';
import {getUnixTs, placeOrder} from '../utils/send';

const SellButton = styled(Button)`
  margin: 20px 0px 0px 0px;
  background: #f23b69;
  border-color: #f23b60;
  border-radius: 4px;
  font-weight: bold;
  width: 270px;
  height: 60px;
  border-radius: 12px;
  font-size:25px;
`;



const BuyButton = styled(Button)`
  margin: 20px 0px 0px 0px;
  background: #02bf76;
  border-color: #02bf76;
  border-radius: 4px;
  font-weight: bold;
  background:#E6BE4B;
  color:black;
  width: 270px;
  height: 60px;
  border-radius: 12px;
  font-size:25px;
`;

const sliderMarks = {
  0: '0%',
  25: '25%',
  50: '50%',
  75: '75%',
  100: '100%',
};

export default function TradeForm({
  style,
  setChangeOrderRef,
}: {
  style?: any;
  setChangeOrderRef?: (
    ref: ({ size, price }: { size?: number; price?: number }) => void,
  ) => void;
}) {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const { baseCurrency, quoteCurrency, market } = useMarket();
  const baseCurrencyBalances = useSelectedBaseCurrencyBalances();
  const quoteCurrencyBalances = useSelectedQuoteCurrencyBalances();
  const baseCurrencyAccount = useSelectedBaseCurrencyAccount();
  const quoteCurrencyAccount = useSelectedQuoteCurrencyAccount();
  const openOrdersAccount = useSelectedOpenOrdersAccount(true);
  const { wallet, connected } = useWallet();
  const sendConnection = useSendConnection();
  const markValue = useMarkPrice();
  const markPrice = markValue![0]
  useFeeDiscountKeys();
  const { storedFeeDiscountKey: feeDiscountKey } = useLocallyStoredFeeDiscountKey();

  const [postOnly, setPostOnly] = useState(false);
  const [ioc, setIoc] = useState(false);
  const [baseSize, setBaseSize] = useState<number | undefined>(undefined);
  const [quoteSize, setQuoteSize] = useState<number | undefined>(undefined);
  const [price, setPrice] = useState<number | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [sizeFraction, setSizeFraction] = useState(0);

  const availableQuote =
    openOrdersAccount && market
      ? market.quoteSplSizeToNumber(openOrdersAccount.quoteTokenFree)
      : 0;

  let quoteBalance = (quoteCurrencyBalances || 0) + (availableQuote || 0);
  let baseBalance = baseCurrencyBalances || 0;
  let sizeDecimalCount =
    market?.minOrderSize && getDecimalCount(market.minOrderSize);
  let priceDecimalCount = market?.tickSize && getDecimalCount(market.tickSize);

  useEffect(() => {
    setChangeOrderRef && setChangeOrderRef(doChangeOrder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setChangeOrderRef]);

  useEffect(() => {
    baseSize && price && onSliderChange(sizeFraction);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [side]);

  useEffect(() => {
    updateSizeFraction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [price, baseSize]);

  const walletPubkey =  wallet?.publicKey
  useEffect(() => {
    const warmUpCache = async () => {
      try {
        if (!wallet || !wallet.publicKey || !market) {
          console.log(`Skipping refreshing accounts`);
          return;
        }
        const startTime = getUnixTs();
        console.log(`Refreshing accounts for ${market.address}`);
        await market?.findOpenOrdersAccountsForOwner(
          sendConnection,
          wallet.publicKey,
        );
        await market?.findBestFeeDiscountKey(sendConnection, wallet.publicKey);
        const endTime = getUnixTs();
        console.log(
          `Finished refreshing accounts for ${market.address} after ${
            endTime - startTime
          }`,
        );
      } catch (e) {
        console.log(`Encountered error when refreshing trading accounts: ${e}`);
      }
    };
    warmUpCache();
    const id = setInterval(warmUpCache, 30_000);
    return () => clearInterval(id);
  }, [market, sendConnection, wallet, walletPubkey]);

  const onSetBaseSize = (baseSize: number | undefined) => {
    setBaseSize(baseSize);
    if (!baseSize) {
      setQuoteSize(undefined);
      return;
    }
    let usePrice = price || markPrice;
    if (!usePrice) {
      setQuoteSize(undefined);
      return;
    }
    const rawQuoteSize = baseSize * usePrice;
    const quoteSize =
      baseSize && roundToDecimal(rawQuoteSize, sizeDecimalCount);
    setQuoteSize(quoteSize);
  };

  const onSetQuoteSize = (quoteSize: number | undefined) => {
    setQuoteSize(quoteSize);
    if (!quoteSize) {
      setBaseSize(undefined);
      return;
    }
    let usePrice = price || markPrice;
    if (!usePrice) {
      setBaseSize(undefined);
      return;
    }
    const rawBaseSize = quoteSize / usePrice;
    const baseSize = quoteSize && roundToDecimal(rawBaseSize, sizeDecimalCount);
    setBaseSize(baseSize);
  };

  const doChangeOrder = ({
    size,
    price,
  }: {
    size?: number;
    price?: number;
  }) => {
    const formattedSize = size && roundToDecimal(size, sizeDecimalCount);
    const formattedPrice = price && roundToDecimal(price, priceDecimalCount);
    formattedSize && onSetBaseSize(formattedSize);
    formattedPrice && setPrice(formattedPrice);
  };

  const updateSizeFraction = () => {
    const rawMaxSize =
      side === 'buy' ? quoteBalance / (price || markPrice || 1) : baseBalance;
    const maxSize = floorToDecimal(rawMaxSize, sizeDecimalCount);
    const sizeFraction = Math.min(((baseSize || 0) / maxSize) * 100, 100);
    setSizeFraction(sizeFraction);
  };

  const onSliderChange = (value) => {
    if (!price && markPrice) {
      let formattedMarkPrice: number | string = priceDecimalCount
        ? markPrice.toFixed(priceDecimalCount)
        : markPrice;
      setPrice(
        typeof formattedMarkPrice === 'number'
          ? formattedMarkPrice
          : parseFloat(formattedMarkPrice),
      );
    }

    let newSize;
    if (side === 'buy') {
      if (price || markPrice) {
        newSize = ((quoteBalance / (price || markPrice || 1)) * value) / 100;
      }
    } else {
      newSize = (baseBalance * value) / 100;
    }

    // round down to minOrderSize increment
    let formatted = floorToDecimal(newSize, sizeDecimalCount);

    onSetBaseSize(formatted);
  };

  const postOnChange: SwitchChangeEventHandler = (checked) => {
    if (checked) {
      setIoc(false);
    }
    setPostOnly(checked);
  };
  const iocOnChange: SwitchChangeEventHandler = (checked) => {
    if (checked) {
      setPostOnly(false);
    }
    setIoc(checked);
  };

  async function onSubmit() {
    if (!price) {
      console.warn('Missing price');
      notify({
        message: 'Missing price',
        type: 'error',
      });
      return;
    } else if (!baseSize) {
      console.warn('Missing size');
      notify({
        message: 'Missing size',
        type: 'error',
      });
      return;
    }

    setSubmitting(true);
    try {
      if (wallet) {
      await placeOrder({
        side,
        price,
        size: baseSize,
        orderType: ioc ? 'ioc' : postOnly ? 'postOnly' : 'limit',
        market,
        connection: sendConnection,
        wallet,
        baseCurrencyAccount: baseCurrencyAccount?.pubkey,
        quoteCurrencyAccount: quoteCurrencyAccount?.pubkey,
        feeDiscountPubkey: feeDiscountKey
      });
      refreshCache(tuple('getTokenAccounts', wallet, connected));
      setPrice(undefined);
      onSetBaseSize(undefined);
    } else {
      throw Error('Error placing order')
    }
    } catch (e) {
      console.warn(e);
      notify({
        message: 'Error placing order',
        description: e.message,
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  }

  // @ts-ignore
  return (
    <FloatingElement
      style={{ display: 'flex', flexDirection: 'column',alignItems:"center", ...style }}
    >
      <div style={{ flex: 1 }}>
        <Row>
          <Col
            span={12}
            onClick={() => setSide('buy')}
            style={{
              height: 50,
              cursor: 'pointer',
              width: '50%',
              textAlign: 'center',
              border: 'transparent',
              borderBottom: side === 'buy' ? '6px solid #02bf76' : '6px solid #1C274F',
              background: 'transparent',
              fontSize: 20,
              fontStyle: 'normal',
              fontWeight: 600,
              color: side === 'buy' ? '#F1F1F2' : 'rgba(241, 241, 242, 0.5)',
              padding: '12px 0 0 0'
            }}
          >
            BUY
          </Col>
          <Col
            span={12}
            onClick={() => setSide('sell')}
            style={{
              height: 50,
              width: '50%',
              textAlign: 'center',
              cursor: 'pointer',
              border: 'transparent',
              borderBottom: side === 'sell' ? '6px solid #f23b69' : '6px solid #1C274F',
              background: 'transparent',
              fontSize: 20,
              fontStyle: 'normal',
              fontWeight: 600,
              color: side === 'sell' ? '#F1F1F2' : 'rgba(241, 241, 242, 0.5)',
              padding: '12px 0 0 0'
            }}
          >
            SELL
          </Col>
          </Row>
        <Input
          style={{ textAlign: 'right', paddingBottom: 8 }}
          addonBefore={<div style={{ width: '50px' }}>Price</div>}
          suffix={
            <span style={{ fontSize: 15, opacity: 0.5 }}>{quoteCurrency}</span>
          }
          value={price}
          type="number"
          step={market?.tickSize || 1}
          onChange={(e) => setPrice(parseFloat(e.target.value))}
        />
        <Input
          style={{ textAlign: 'right', paddingBottom: 8 }}
          addonBefore={<div style={{ width: '50px' }}>Amount</div>}
          suffix={
            <span style={{ fontSize: 15, opacity: 0.5 }}>{baseCurrency}</span>
          }
          value={baseSize}
          type="number"
          step={market?.minOrderSize || 1}
          onChange={(e) => onSetBaseSize(parseFloat(e.target.value))}
        />
        <Input
          style={{ textAlign: 'right', paddingBottom: 8, marginBottom: 12 }}
          suffix={
            <span style={{ fontSize: 15, opacity: 0.5, marginTop: 4 }}>{quoteCurrency}</span>
          }
          value={quoteSize}
          type="number"
          step={market?.minOrderSize || 1}
          onChange={(e) => onSetQuoteSize(parseFloat(e.target.value))}
        />
        <Slider
          value={sizeFraction}
          tipFormatter={(value) => `${value}%`}
          marks={sliderMarks}
          onChange={onSliderChange}
        />
        <div style={{ paddingTop: 18 }}>
          {'POST '}
          <Switch
            checked={postOnly}
            onChange={postOnChange}
            style={{ marginRight: 40 }}
          />
          {'IOC '}
          <Switch checked={ioc} onChange={iocOnChange} />
        </div>
      </div>
      {side === 'buy' ? (
        <BuyButton
          disabled={!price || !baseSize}
          onClick={onSubmit}
          block
          type="primary"
          size="large"
          loading={submitting}
        >
          Buy {baseCurrency}
        </BuyButton>
      ) : (
        <SellButton
          disabled={!price || !baseSize}
          onClick={onSubmit}
          block
          type="primary"
          size="large"
          loading={submitting}
        >
          Sell {baseCurrency}
        </SellButton>
      )}
    </FloatingElement>
  );
}
