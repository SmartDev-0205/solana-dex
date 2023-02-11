import { Col, Row} from 'antd';
import React, { useRef, useEffect, useState } from 'react';
import styled, { css } from 'styled-components';
import { useMarket, useOrderbook, useMarkPrice } from '../utils/markets';
import { isEqual, getDecimalCount } from '../utils/utils';
import { useInterval } from '../utils/useInterval';
import FloatingElement from './layout/FloatingElement';
import usePrevious from '../utils/usePrevious';

const Title = styled.div`
  color: rgba(255, 255, 255, 1);
`;

const SizeTitle = styled(Row)`
  padding: 4px 0 4px 0px;
  color: #676767;
`;

const MarkPriceTitle = styled(Row)`
  padding: 20px 0 14px;
  font-weight: 700;
`;

const Line = styled.div`
  text-align: ${(props) => (props.invert ? 'left' : 'right')};
  float: ${(props) => (props.invert ? 'left' : 'right')};
  height: 100%;
  ${(props) =>
    props['data-width'] &&
    css`
      width: ${props['data-width']};
    `}
  ${(props) =>
    props['data-bgcolor'] &&
    css`
      background-color: ${props['data-bgcolor']};
    `}
`;

const Price = styled.div`
  position: absolute;
  ${(props) =>
    props.invert
      ? css`
          left: 5px;
        `
      : css`
          right: 5px;
        `}
  ${(props) =>
    props['data-color'] &&
    css`
      color: ${props['data-color']};
    `}
`;

export default function Orderbook({
  smallScreen,
  depth = 80,
  onPrice,
  onSize,
}) {
  const [markPrice] = useMarkPrice();
  const [orderbook] = useOrderbook(90);
  // let { baseCurrency, quoteCurrency } = useMarket();
  const market = useMarket();
  const marketName = market.marketName;
  const currentOrderbookData = useRef(null);
  const lastOrderbookData = useRef(null);

  const [orderbookData, setOrderbookData] = useState(null);
  const [baseCurrency, setBaseCurrency] = useState("");
  const [quoteCurrency, setQuoteCurrency] = useState("");

  useInterval(() => {
    if (
      !currentOrderbookData.current ||
      JSON.stringify(currentOrderbookData.current) !==
      JSON.stringify(lastOrderbookData.current)
    ) {
      let bids = orderbook?.bids || [];
      let asks = orderbook?.asks || [];

      let sum = (total, [, size], index) =>
        index < depth ? total + size : total;
      let totalSize = bids.reduce(sum, 0) + asks.reduce(sum, 0);

      let bidsToDisplay = getCumulativeOrderbookSide(bids, totalSize, false);
      let asksToDisplay = getCumulativeOrderbookSide(asks, totalSize, true);

      currentOrderbookData.current = {
        bids: orderbook?.bids,
        asks: orderbook?.asks,
      };

      setOrderbookData({ bids: bidsToDisplay, asks: asksToDisplay });
    }

    
    let symbols = [];
    if (marketName) {
      symbols = marketName.split("/");
    }
    if (symbols.length > 1) {
      setBaseCurrency(symbols[0]);
      setQuoteCurrency(symbols[1]);
    }
    return symbols[0], symbols[1];
  }, 250);

  useEffect(() => {
    lastOrderbookData.current = {
      bids: orderbook?.bids,
      asks: orderbook?.asks,
    };
  }, [orderbook]);

  function getCumulativeOrderbookSide(orders, totalSize, backwards = false) {
    let cumulative = orders
      .slice(0, depth)
      .reduce((cumulative, [price, size], i) => {
        const cumulativeSize = (cumulative[i - 1]?.cumulativeSize || 0) + size;
        cumulative.push({
          price,
          size,
          cumulativeSize,
          sizePercent: Math.round((cumulativeSize / (totalSize || 1)) * 100),
        });
        return cumulative;
      }, []);
    if (backwards) {
      cumulative = cumulative.reverse();
    }
    return cumulative;
  }

  return (
    <FloatingElement
      style={
        smallScreen ? { flex: 1, overflow: 'hidden',width:'100%' } : { overflow: 'hidden',width:'100%' }
      }
    >
      {/* <Divider> */}
      <Title className="title">Orderbook</Title>
      {/* </Divider> */}
      {1 ? ( //smallScreen ? (
        <>
          <MarkPriceComponent markPrice={markPrice} />
          <div className='orderbook-line'>
            <strong>Buyer</strong>
            <strong>Seller</strong>
          </div>
          <div
            style={{
              marginRight: '-20px',
              paddingRight: '5px',
              overflowY: 'scroll',
              maxHeight: 400,
            }}
          >
            <Row style={{ flexWrap: 'nowrap' }}>
              <Col flex={1}>
                <SizeTitle>
                  <Col
                    span={12}
                    style={{
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                    }}
                  >
                    Size ({baseCurrency})
                  </Col>
                  <Col
                    span={12}
                    style={{
                      textAlign: 'right',
                      paddingRight: 10,
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                    }}
                  >
                    Price ({quoteCurrency})
                  </Col>
                </SizeTitle>
                {orderbookData?.bids.map(({ price, size, sizePercent }) => (
                  <OrderbookRow
                    key={price + ''}
                    price={price}
                    size={size}
                    side={'buy'}
                    sizePercent={sizePercent}
                    onPriceClick={() => onPrice(price)}
                    onSizeClick={() => onSize(size)}
                  />
                ))}
              </Col>
              <Col flex={1} style={{ paddingLeft: 2 }}>
                <SizeTitle>
                  <Col
                    span={12}
                    style={{
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Price ({quoteCurrency}) */}
                  </Col>
                  <Col
                    span={12}
                    style={{
                      textAlign: 'right',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                    }}
                  >
                    Size ({baseCurrency})
                  </Col>
                </SizeTitle>
                {orderbookData?.asks
                  .slice(0)
                  .reverse()
                  .map(({ price, size, sizePercent }) => (
                    <OrderbookRow
                      invert={true}
                      key={price + ''}
                      price={price}
                      size={size}
                      side={'sell'}
                      sizePercent={sizePercent}
                      onPriceClick={() => onPrice(price)}
                      onSizeClick={() => onSize(size)}
                    />
                  ))}
              </Col>
            </Row>
          </div>
        </>
      ) : (
        <>
          <SizeTitle>
            <Col
              span={12}
              style={{
                textAlign: 'left',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
              }}
            >
              Size ({baseCurrency})
            </Col>
            <Col
              span={12}
              style={{
                textAlign: 'right',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
              }}
            >
              Price ({quoteCurrency})
            </Col>
          </SizeTitle>
          {orderbookData?.asks.map(({ price, size, sizePercent }) => (
            <OrderbookRow
              key={price + ''}
              price={price}
              size={size}
              side={'sell'}
              sizePercent={sizePercent}
              onPriceClick={() => onPrice(price)}
              onSizeClick={() => onSize(size)}
            />
          ))}
          <MarkPriceComponent markPrice={markPrice} />
          {orderbookData?.bids.map(({ price, size, sizePercent }) => (
            <OrderbookRow
              key={price + ''}
              price={price}
              size={size}
              side={'buy'}
              sizePercent={sizePercent}
              onPriceClick={() => onPrice(price)}
              onSizeClick={() => onSize(size)}
            />
          ))}
        </>
      )}
    </FloatingElement>
  );
}

const OrderbookRow = React.memo(
  ({ side, price, size, sizePercent, onSizeClick, onPriceClick, invert }) => {
    const element = useRef();

    const { market } = useMarket();

    useEffect(() => {
      // eslint-disable-next-line
      !element.current?.classList.contains('flash') &&
        element.current?.classList.add('flash');
      const id = setTimeout(
        () =>
          element.current?.classList.contains('flash') &&
          element.current?.classList.remove('flash'),
        250,
      );
      return () => clearTimeout(id);
    }, [price, size]);

    let formattedSize =
      market?.minOrderSize && !isNaN(size)
        ? Number(size).toFixed(getDecimalCount(market.minOrderSize) + 1)
        : size;

    let formattedPrice =
      market?.tickSize && !isNaN(price)
        ? Number(price).toFixed(getDecimalCount(market.tickSize) + 1)
        : price;

    return (
      <Row ref={element} style={{ marginBottom: 1 }} onClick={onSizeClick}>
        {invert ? (
          <>
            <Col span={12} style={{ textAlign: 'left' }}>
              <Line
                invert
                data-width={sizePercent + '%'}
                data-bgcolor={side === 'buy' ? '#06894A' : '#A2024C'}
              />
              <Price
                invert
                data-color={side === 'buy' ? '#ffffff' : 'white'}
                onClick={onPriceClick}
              >
                {formattedPrice}
              </Price>
            </Col>
            <Col span={12} style={{ textAlign: 'right' }}>
              {formattedSize}
            </Col>
          </>
        ) : (
          <>
            <Col span={12} style={{ textAlign: 'left' }}>
              {formattedSize}
            </Col>
            <Col span={12} style={{ textAlign: 'right' }}>
              <Line
                data-width={sizePercent + '%'}
                data-bgcolor={side === 'buy' ? '#06894A' : '#A2024C'}
              />
              <Price
                data-color={side === 'buy' ? '#ffffff' : 'white'}
                onClick={onPriceClick}
              >
                {formattedPrice}
              </Price>
            </Col>
          </>
        )}
      </Row>
    );
  },
  (prevProps, nextProps) =>
    isEqual(prevProps, nextProps, ['price', 'size', 'sizePercent']),
);

const MarkPriceComponent = React.memo(
  ({ markPrice }) => {
    const { market } = useMarket();
    const previousMarkPrice = usePrevious(markPrice);

    let markPriceColor =
      markPrice > previousMarkPrice
        ? '#0AD171'
        : markPrice < previousMarkPrice
          ? '#FD499D'
          : 'white';

    let formattedMarkPrice =
      markPrice &&
      market?.tickSize &&
      markPrice.toFixed(getDecimalCount(market.tickSize));

    return (
      <MarkPriceTitle justify="center">
        <Col style={{ color: markPriceColor }}>
          {markPrice && <>{markPrice.toFixed(4)}</>}

          {/* {markPrice > previousMarkPrice && (
            <ArrowUpOutlined style={{ marginRight: 5 }} />
          )}
          {markPrice < previousMarkPrice && (
            <ArrowDownOutlined style={{ marginRight: 5 }} />
          )}
          {formattedMarkPrice || '----'} */}
        </Col>
      </MarkPriceTitle>
    );
  },
  (prevProps, nextProps) => isEqual(prevProps, nextProps, ['markPrice']),
);
